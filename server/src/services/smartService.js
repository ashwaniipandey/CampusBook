import mongoose from 'mongoose';
import {
  Book,
  DonationRequest,
  ExchangeRequest,
  Order,
  UserBookView,
  Wishlist,
} from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { getReviewStatsBySeller } from '../utils/reviewStats.js';

const APPROVED_STATUSES = ['approved', 'available'];
const COMPLETED_ORDER_STATUSES = ['completed'];
const DAY_MS = 24 * 60 * 60 * 1000;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let platformImpactCache = null;
let platformImpactRequest = null;

const populateBook = (books) => Book.populate(books, [
  { path: 'category', select: 'name slug' },
  { path: 'university', select: 'name code' },
  { path: 'seller', select: 'name avatar isVerified rating totalRatings' },
]);

const popularBooks = async (limit) => {
  const books = await Book.find({ status: { $in: APPROVED_STATUSES } })
    .sort({ views: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return populateBook(books);
};

const matchCondition = (field, value) => ({
  $eq: [
    { $toLower: { $ifNull: [`$${field}`, ''] } },
    value.toLowerCase(),
  ],
});

export const getTrendingBooks = async (limit) => popularBooks(limit);

export const getSmartRecommendations = async (user, limit) => {
  const userId = new mongoose.Types.ObjectId(user._id);
  const [
    wishlistEntries,
    purchasedBooks,
    viewedEntries,
    ownedBooks,
  ] = await Promise.all([
    Wishlist.find({ user: userId }).select('book').populate('book', 'category').lean(),
    Order.find({
      buyer: userId,
      $or: [{ status: 'completed' }, { orderStatus: 'completed' }],
    }).select('book').populate('book', 'category').lean(),
    UserBookView.find({ user: userId }).select('book').populate('book', 'category').lean(),
    Book.find({ seller: userId }).select('listingType').lean(),
  ]);

  const wishlistCategories = [...new Set(
    wishlistEntries.map((entry) => entry.book?.category?.toString()).filter(Boolean)
  )].map((id) => new mongoose.Types.ObjectId(id));
  const historyCategories = [...new Set([
    ...purchasedBooks.map((entry) => entry.book?.category?.toString()),
    ...viewedEntries.map((entry) => entry.book?.category?.toString()),
  ].filter(Boolean))].map((id) => new mongoose.Types.ObjectId(id));
  const usedListingTypes = [...new Set(ownedBooks.map((book) => book.listingType).filter(Boolean))];

  const course = typeof user.course === 'string' ? user.course.trim() : '';
  const semester = typeof user.semester === 'string' ? user.semester.trim() : '';
  const universityId = user.university?._id || user.university;
  const hasUniversity = Boolean(universityId && mongoose.Types.ObjectId.isValid(universityId.toString()));
  const hasProfileSignals = Boolean(
    course || semester || hasUniversity || wishlistCategories.length || historyCategories.length || usedListingTypes.length
  );

  if (!hasProfileSignals) {
    const books = await popularBooks(limit);
    return books.map((book) => ({
      ...book,
      score: Number(book.views || 0),
      reasons: ['Popular on CampusBook'],
    }));
  }

  const scoreConditions = [];
  const candidateConditions = [];
  const addCondition = (weight, reason, expression, candidate) => {
    scoreConditions.push({ weight, reason, expression });
    candidateConditions.push(candidate);
  };

  if (course) {
    addCondition(4, 'Matches your course', matchCondition('course', course), {
      course: new RegExp(`^${escapeRegex(course)}$`, 'i'),
    });
  }
  if (semester) {
    addCondition(3, 'Matches your semester', matchCondition('semester', semester), {
      semester: new RegExp(`^${escapeRegex(semester)}$`, 'i'),
    });
  }
  if (hasUniversity) {
    const normalizedUniversityId = new mongoose.Types.ObjectId(universityId.toString());
    addCondition(3, 'At your university', { $eq: ['$university', normalizedUniversityId] }, {
      university: normalizedUniversityId,
    });
  }
  if (wishlistCategories.length) {
    addCondition(2, 'In a wishlisted category', { $in: ['$category', wishlistCategories] }, {
      category: { $in: wishlistCategories },
    });
  }
  if (historyCategories.length) {
    addCondition(2, 'Related to books you viewed or purchased', { $in: ['$category', historyCategories] }, {
      category: { $in: historyCategories },
    });
  }
  if (usedListingTypes.length) {
    addCondition(1, 'Matches a listing type you use', { $in: ['$listingType', usedListingTypes] }, {
      listingType: { $in: usedListingTypes },
    });
  }

  if (!candidateConditions.length) {
    const books = await popularBooks(limit);
    return books.map((book) => ({
      ...book,
      score: Number(book.views || 0),
      reasons: ['Popular on CampusBook'],
    }));
  }

  const recentCutoff = new Date(Date.now() - 30 * DAY_MS);
  const recentExpression = { $gte: ['$createdAt', recentCutoff] };
  const likeNewExpression = { $eq: ['$condition', 'Like New'] };
  const match = {
    status: { $in: APPROVED_STATUSES },
    seller: { $ne: userId },
    $or: candidateConditions,
  };
  const scoreParts = scoreConditions.map(({ weight, expression }) => ({
    $cond: [expression, weight, 0],
  }));
  scoreParts.push({ $cond: [recentExpression, 0.5, 0] });
  scoreParts.push({ $cond: [likeNewExpression, 0.5, 0] });

  const recommendations = await Book.aggregate([
    { $match: match },
    {
      $addFields: {
        score: { $add: scoreParts },
        reasons: {
          $map: {
            input: {
              $filter: {
                input: [
                  ...scoreConditions.map(({ reason, expression }) => ({ reason, matched: expression })),
                  { reason: 'Recently listed', matched: recentExpression },
                  { reason: 'Like New condition', matched: likeNewExpression },
                ],
                as: 'reasonEntry',
                cond: '$$reasonEntry.matched',
              },
            },
            as: 'reasonEntry',
            in: '$$reasonEntry.reason',
          },
        },
      },
    },
    { $sort: { score: -1, views: -1, createdAt: -1 } },
    { $limit: limit },
  ]);
  return populateBook(recommendations);
};

const comparableBookScore = (left, right) => {
  const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const titleMatch = normalize(left.title) && normalize(left.title) === normalize(right.title);
  const isbnMatch = normalize(left.isbn) && normalize(left.isbn) === normalize(right.isbn);
  const subjectMatch = normalize(left.subject) && normalize(left.subject) === normalize(right.subject);
  return (titleMatch ? 30 : 0) + (isbnMatch ? 25 : 0) + (subjectMatch ? 15 : 0);
};

const preferenceMatchesBook = (preferences, book) => {
  const normalizedPreferences = String(preferences || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (!normalizedPreferences) return false;
  return [book.title, book.isbn, book.subject].some((value) => {
    const normalizedValue = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    return normalizedValue.length >= 3 && normalizedPreferences.includes(normalizedValue);
  });
};

export const getExchangeMatches = async (user) => {
  const userId = new mongoose.Types.ObjectId(user._id);
  const approvedFilter = { status: { $in: APPROVED_STATUSES } };
  const [wishlistEntries, ownBooks] = await Promise.all([
    Wishlist.find({ user: userId }).populate('book').lean(),
    Book.find({
      ...approvedFilter,
      seller: userId,
      $or: [
        { listingType: 'exchange' },
        { exchangePreferences: /\S/ },
      ],
    }).lean(),
  ]);
  const desiredBooks = wishlistEntries.map((entry) => entry.book).filter(Boolean);
  if (!ownBooks.length || (
    !desiredBooks.length &&
    !ownBooks.some((book) => String(book.exchangePreferences || '').trim())
  )) return [];

  const candidateBooks = await Book.find({
    ...approvedFilter,
    listingType: 'exchange',
    seller: { $ne: userId },
  })
    .populate({
      path: 'seller',
      select: 'name university rating totalRatings role',
      populate: { path: 'university', select: 'name' },
    })
    .lean();
  const candidateOwners = [...new Set(
    candidateBooks
      .filter((book) => book.seller?._id && book.seller.role === 'student')
      .map((book) => book.seller._id.toString())
  )];
  if (!candidateOwners.length) return [];

  const [otherWishlists, activeRequests] = await Promise.all([
    Wishlist.find({ user: { $in: candidateOwners } }).populate('book').lean(),
    ExchangeRequest.find({
      status: { $in: ['pending', 'accepted'] },
      $or: [{ requester: userId }, { bookOwner: userId }],
    }).select('requester bookOwner requestedBook offeredBook').lean(),
  ]);

  const wishlistByUser = new Map();
  for (const entry of otherWishlists) {
    if (!entry.book) continue;
    const ownerId = entry.user.toString();
    wishlistByUser.set(ownerId, [...(wishlistByUser.get(ownerId) || []), entry.book]);
  }
  const activeBookPairs = new Set(
    activeRequests.map((request) => {
      const requestedBook = request.requestedBook.toString();
      const offeredBook = request.offeredBook.toString();
      return [requestedBook, offeredBook].sort().join(':');
    })
  );
  const matches = [];
  const seenPairs = new Set();

  for (const theirBook of candidateBooks) {
    const otherUser = theirBook.seller;
    if (
      !otherUser?._id ||
      otherUser.role !== 'student'
    ) continue;

    const wantedMatch = desiredBooks.reduce(
      (best, wantedBook) => Math.max(best, comparableBookScore(wantedBook, theirBook)),
      0
    );
    const preferenceMatch = ownBooks.some((book) =>
      preferenceMatchesBook(book.exchangePreferences, theirBook)
    );
    if (!wantedMatch && !preferenceMatch) continue;

    for (const yourBook of ownBooks) {
      const bookPairKey = [theirBook._id.toString(), yourBook._id.toString()].sort().join(':');
      if (activeBookPairs.has(bookPairKey)) continue;
      const reciprocalWishlistScore = (wishlistByUser.get(otherUser._id.toString()) || [])
        .reduce((best, wantedBook) => Math.max(best, comparableBookScore(wantedBook, yourBook)), 0);
      const reciprocalPreferenceMatch = preferenceMatchesBook(theirBook.exchangePreferences, yourBook);
      const mutual = reciprocalWishlistScore > 0 || reciprocalPreferenceMatch;
      const pairKey = `${otherUser._id}:${theirBook._id}:${yourBook._id}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      const matchScore = Math.min(
        100,
        40 + Math.max(wantedMatch, preferenceMatch ? 15 : 0) +
          Math.max(reciprocalWishlistScore, reciprocalPreferenceMatch ? 15 : 0) +
          (mutual ? 10 : 0)
      );
      matches.push({
        matchType: mutual ? 'mutual' : 'one_way',
        yourBook,
        theirBook,
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          university: otherUser.university,
          rating: otherUser.rating,
          totalRatings: otherUser.totalRatings,
        },
        matchScore,
        reason: mutual
          ? 'You want their book, and they want yours.'
          : 'Their book matches your wishlist or exchange preferences.',
      });
    }
  }

  const sortedMatches = matches.sort((left, right) =>
    Number(right.matchType === 'mutual') - Number(left.matchType === 'mutual') ||
    right.matchScore - left.matchScore
  );
  const reviewStats = await getReviewStatsBySeller(
    sortedMatches.map((match) => match.otherUser._id)
  );
  return sortedMatches.map((match) => ({
    ...match,
    otherUser: {
      ...match.otherUser,
      ...(reviewStats.get(String(match.otherUser._id)) || { rating: 0, totalRatings: 0 }),
    },
  }));
};

const CONDITION_MULTIPLIERS = {
  'like new': 0.7,
  excellent: 0.65,
  good: 0.55,
  acceptable: 0.4,
  new: 0.7,
  fair: 0.4,
  poor: 0.4,
};

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const getPriceSuggestion = async ({ category, originalPrice, condition, edition, title }) => {
  const filter = {
    category: new mongoose.Types.ObjectId(category),
    listingType: 'sell',
    status: { $in: [...APPROVED_STATUSES, 'sold'] },
  };
  if (title) filter.title = new RegExp(`^${escapeRegex(title)}$`, 'i');
  if (edition) filter.edition = new RegExp(`^${escapeRegex(edition)}$`, 'i');

  const similarStats = await Book.aggregate([
    { $match: filter },
    {
      $addFields: {
        effectivePrice: {
          $cond: [
            { $gt: [{ $ifNull: ['$sellingPrice', 0] }, 0] },
            '$sellingPrice',
            { $ifNull: ['$price', 0] },
          ],
        },
      },
    },
    { $match: { effectivePrice: { $gt: 0 } } },
    {
      $group: {
        _id: null,
        min: { $min: '$effectivePrice' },
        max: { $max: '$effectivePrice' },
        average: { $avg: '$effectivePrice' },
        sampleSize: { $sum: 1 },
      },
    },
  ]);

  const comparable = similarStats[0];
  if (comparable && comparable.sampleSize >= 3) {
    return {
      min: roundCurrency(comparable.min),
      max: roundCurrency(comparable.max),
      suggested: roundCurrency(comparable.average),
      basedOn: 'similar listings',
      sampleSize: comparable.sampleSize,
    };
  }

  const multiplier = CONDITION_MULTIPLIERS[condition.toLowerCase()];
  const suggested = roundCurrency(originalPrice * multiplier);
  return {
    min: roundCurrency(suggested * 0.9),
    max: roundCurrency(suggested * 1.1),
    suggested,
    basedOn: 'condition formula',
    sampleSize: comparable?.sampleSize || 0,
  };
};

const isCompletedOrder = {
  $or: [{ status: 'completed' }, { orderStatus: 'completed' }],
};

const calculateImpact = (purchases, exchanges, donations, totalSaved) => {
  const booksReused = purchases + exchanges + donations;
  // Estimate 3.3 kg of CO2 saved per reused book and one tree per 12 reused books.
  return {
    totalSaved: roundCurrency(totalSaved),
    purchases,
    impact: {
      booksReused,
      estimatedCo2SavedKg: Math.round(booksReused * 3.3 * 10) / 10,
      treesSaved: Math.round((booksReused / 12) * 10) / 10,
    },
  };
};

export const getUserSavings = async (userId) => {
  const [orders, exchanges, donations] = await Promise.all([
    Order.find({ buyer: userId, ...isCompletedOrder })
      .select('price amount book')
      .populate('book', 'originalPrice')
      .lean(),
    ExchangeRequest.countDocuments({
      status: 'completed',
      $or: [{ requester: userId }, { bookOwner: userId }],
    }),
    DonationRequest.countDocuments({
      status: 'completed',
      $or: [{ requester: userId }, { donor: userId }],
    }),
  ]);
  const totalSaved = orders.reduce((total, order) => {
    const originalPrice = Number(order.book?.originalPrice || 0);
    const paidPrice = Number(order.amount ?? order.price ?? 0);
    return total + Math.max(0, originalPrice - paidPrice);
  }, 0);
  return calculateImpact(orders.length, exchanges, donations, totalSaved);
};

const calculatePlatformImpact = async () => {
  const [
    orderTotals,
    exchanges,
    donations,
    buyers,
    exchangeRequesters,
    exchangeOwners,
    donationRequesters,
    donors,
  ] = await Promise.all([
    Order.aggregate([
      { $match: isCompletedOrder },
      {
        $lookup: {
          from: Book.collection.name,
          localField: 'book',
          foreignField: '_id',
          as: 'bookData',
        },
      },
      { $unwind: { path: '$bookData', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          savings: {
            $max: [
              0,
              {
                $subtract: [
                  { $ifNull: ['$bookData.originalPrice', 0] },
                  { $ifNull: ['$amount', { $ifNull: ['$price', 0] }] },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          purchases: { $sum: 1 },
          totalSaved: { $sum: '$savings' },
        },
      },
    ]),
    ExchangeRequest.countDocuments({ status: 'completed' }),
    DonationRequest.countDocuments({ status: 'completed' }),
    Order.distinct('buyer', isCompletedOrder),
    ExchangeRequest.distinct('requester', { status: 'completed' }),
    ExchangeRequest.distinct('bookOwner', { status: 'completed' }),
    DonationRequest.distinct('requester', { status: 'completed' }),
    DonationRequest.distinct('donor', { status: 'completed' }),
  ]);
  const students = new Set(
    [...buyers, ...exchangeRequesters, ...exchangeOwners, ...donationRequesters, ...donors]
      .filter(Boolean)
      .map((id) => id.toString())
  ).size;
  return {
    ...calculateImpact(
    orderTotals[0]?.purchases || 0,
    exchanges,
    donations,
    orderTotals[0]?.totalSaved || 0
    ),
    students,
  };
};

export const getPlatformImpact = async () => {
  if (platformImpactCache && platformImpactCache.expiresAt > Date.now()) {
    return platformImpactCache.value;
  }
  if (!platformImpactRequest) {
    platformImpactRequest = calculatePlatformImpact()
      .then((value) => {
        platformImpactCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
        return value;
      })
      .finally(() => {
        platformImpactRequest = null;
      });
  }
  return platformImpactRequest;
};

export const validateRecommendationLimit = (rawLimit) => {
  if (rawLimit === undefined) return 8;
  if (Array.isArray(rawLimit) || typeof rawLimit !== 'string' || !/^\d+$/.test(rawLimit)) {
    throw new AppError('limit must be an integer between 1 and 30.', 400);
  }
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) {
    throw new AppError('limit must be an integer between 1 and 30.', 400);
  }
  return limit;
};

export const validatePriceSuggestionQuery = (query) => {
  const { category, originalPrice, condition, edition, title } = query;
  if (typeof category !== 'string' || !mongoose.Types.ObjectId.isValid(category)) {
    throw new AppError('category must be a valid category ID.', 400);
  }
  if (typeof originalPrice !== 'string' || originalPrice.trim() === '') {
    throw new AppError('originalPrice is required and must be a positive number.', 400);
  }
  const parsedOriginalPrice = Number(originalPrice);
  if (!Number.isFinite(parsedOriginalPrice) || parsedOriginalPrice <= 0 || parsedOriginalPrice > 10000000) {
    throw new AppError('originalPrice must be a number greater than 0 and no more than 10000000.', 400);
  }
  if (typeof condition !== 'string' || !Object.hasOwn(CONDITION_MULTIPLIERS, condition.toLowerCase())) {
    throw new AppError('condition must be New, Like New, Excellent, Good, Acceptable, Fair, or Poor.', 400);
  }
  for (const [field, value, maxLength] of [
    ['title', title, 200],
    ['edition', edition, 80],
  ]) {
    if (value !== undefined && (typeof value !== 'string' || value.length > maxLength)) {
      throw new AppError(`${field} must be a string no longer than ${maxLength} characters.`, 400);
    }
  }
  return {
    category,
    originalPrice: parsedOriginalPrice,
    condition,
    ...(edition?.trim() ? { edition: edition.trim() } : {}),
    ...(title?.trim() ? { title: title.trim() } : {}),
  };
};
