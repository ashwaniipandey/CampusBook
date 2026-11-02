import mongoose from 'mongoose';
import Book from '../models/Book.js';
import University from '../models/University.js';
import Category from '../models/Category.js';
import Wishlist from '../models/Wishlist.js';
import UserBookView from '../models/UserBookView.js';
import { AppError } from '../middlewares/errorHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * Get all approved books with search, multi-filters, sorting, and pagination
 * GET /api/books
 * Access: Public
 */
export const getAllBooks = async (req, res, next) => {
  try {
    const approvedStatuses = ['approved', 'available'];
    const andClauses = [{ status: { $in: approvedStatuses } }];

    const rawQuery = req.query.q;
    if (rawQuery !== undefined && (typeof rawQuery !== 'string' || rawQuery.length > 120)) {
      return next(new AppError('Search query must be a string of 120 characters or fewer.', 400));
    }
    const q = typeof rawQuery === 'string' ? rawQuery.trim() : '';
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const queryRegex = q ? new RegExp(safeQ, 'i') : null;
    if (queryRegex) {
      andClauses.push({
        $or: ['title', 'author', 'isbn', 'subject', 'course', 'publisher']
          .map((field) => ({ [field]: queryRegex })),
      });
    }

    // 2. Category Filter (supports single ID, multiple comma-separated IDs, or array)
    if (req.query.category) {
      let catList = [];
      if (Array.isArray(req.query.category)) {
        catList = req.query.category.flatMap((c) => String(c).split(','));
      } else {
        catList = String(req.query.category).split(',');
      }

      catList = catList
        .map((c) => c.trim())
        .filter((c) => mongoose.Types.ObjectId.isValid(c));

      if (catList.length > 0) {
        andClauses.push({ category: { $in: catList } });
      }
    }

    // 3. University Filter
    if (req.query.university) {
      const uniId = String(req.query.university).trim();
      if (!mongoose.Types.ObjectId.isValid(uniId)) {
        return next(new AppError('university must be a valid university ID.', 400));
      }
      andClauses.push({ university: new mongoose.Types.ObjectId(uniId) });
    }

    if (req.query.scope !== undefined) {
      if (!['mine', 'all'].includes(req.query.scope)) {
        return next(new AppError('scope must be either mine or all.', 400));
      }
      if (req.query.scope === 'mine') {
        if (!req.user) {
          return next(new AppError('Log in to filter books by your university.', 401));
        }
        const userUniversity = req.user.university?._id || req.user.university;
        if (!userUniversity) {
          return next(new AppError('Your account does not have a university assigned.', 400));
        }
        andClauses.push({ university: userUniversity._id || userUniversity });
      }
    }

    if (req.query.universityName !== undefined) {
      if (typeof req.query.universityName !== 'string' || req.query.universityName.trim().length > 150) {
        return next(new AppError('universityName must be a string of 150 characters or fewer.', 400));
      }
      const universityName = req.query.universityName.trim();
      if (universityName) {
        const nameRegex = new RegExp(
          universityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i'
        );
        const universities = await University.find({ name: nameRegex }).select('_id').lean();
        andClauses.push({ university: { $in: universities.map((university) => university._id) } });
      }
    }

    // 4. Condition Filter (supports multiple, e.g. condition=New,Like New)
    if (req.query.condition) {
      let condList = [];
      if (Array.isArray(req.query.condition)) {
        condList = req.query.condition.flatMap((c) => String(c).split(','));
      } else {
        condList = String(req.query.condition).split(',');
      }

      const allowedConditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
      condList = condList
        .map((c) => c.trim())
        .filter((c) => allowedConditions.includes(c));

      if (condList.length > 0) {
        andClauses.push({ condition: { $in: condList } });
      }
    }

    // 5. Listing Type Filter (sell/exchange/donate)
    if (req.query.listingType) {
      const lt = String(req.query.listingType).trim().toLowerCase();
      if (lt === 'sell') {
        andClauses.push({ listingType: 'sell' });
      } else if (lt === 'donate') {
        andClauses.push({ listingType: 'donate' });
      } else if (lt === 'exchange') {
        andClauses.push({ listingType: 'exchange' });
      }
    }

    // 6. Semester Filter (case-insensitive substring)
    if (req.query.semester && typeof req.query.semester === 'string') {
      const sem = req.query.semester.trim();
      if (sem) {
        const safeSem = sem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        andClauses.push({ semester: new RegExp(safeSem, 'i') });
      }
    }

    // 7. Text filters (case-insensitive substring)
    for (const field of ['course', 'edition', 'publisher']) {
      const value = req.query[field];
      if (value !== undefined) {
        if (typeof value !== 'string' || value.length > (field === 'publisher' ? 150 : 100)) {
          return next(new AppError(`${field} must be a valid string.`, 400));
        }
        const trimmedValue = value.trim();
        if (trimmedValue) {
          const safeValue = trimmedValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          andClauses.push({ [field]: new RegExp(safeValue, 'i') });
        }
      }
    }

    // 8. Price Range (minPrice and maxPrice on sellingPrice / price)
    const priceCriteria = {};
    if (req.query.minPrice !== undefined && req.query.minPrice !== '') {
      const min = Number(req.query.minPrice);
      if (!isNaN(min) && min >= 0) {
        priceCriteria.$gte = min;
      }
    }
    if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') {
      const max = Number(req.query.maxPrice);
      if (!isNaN(max) && max >= 0) {
        priceCriteria.$lte = max;
      }
    }
    if (Object.keys(priceCriteria).length > 0) {
      andClauses.push({
        $or: [
          { sellingPrice: priceCriteria },
          { price: priceCriteria },
        ],
      });
    }

    // Combine all criteria
    const filterQuery = andClauses.length > 1 ? { $and: andClauses } : andClauses[0];

    // 9. Sorting
    let sortOption = { createdAt: -1 };
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'relevance':
          if (!queryRegex) {
            return next(new AppError('sort=relevance requires a non-empty q search query.', 400));
          }
          sortOption = null;
          break;
        case 'price_asc':
          sortOption = { sellingPrice: 1, price: 1, createdAt: -1 };
          break;
        case 'price_desc':
          sortOption = { sellingPrice: -1, price: -1, createdAt: -1 };
          break;
        case 'popular':
          sortOption = { views: -1, createdAt: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    // 10. Pagination (default 12, max 50)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const total = await Book.countDocuments(filterQuery);
    const bookQuery = sortOption
      ? Book.find(filterQuery).sort(sortOption).skip(skip).limit(limit)
      : Book.aggregate([
          { $match: filterQuery },
          {
            $addFields: {
              relevanceScore: {
                $add: [
                  { $cond: [{ $regexMatch: { input: { $ifNull: ['$title', ''] }, regex: safeQ, options: 'i' } }, 32, 0] },
                  { $cond: [{ $regexMatch: { input: { $ifNull: ['$author', ''] }, regex: safeQ, options: 'i' } }, 16, 0] },
                  { $cond: [{ $regexMatch: { input: { $ifNull: ['$isbn', ''] }, regex: safeQ, options: 'i' } }, 8, 0] },
                  { $cond: [{ $regexMatch: { input: { $ifNull: ['$subject', ''] }, regex: safeQ, options: 'i' } }, 4, 0] },
                  { $cond: [{ $regexMatch: { input: { $ifNull: ['$course', ''] }, regex: safeQ, options: 'i' } }, 2, 0] },
                  { $cond: [{ $regexMatch: { input: { $ifNull: ['$publisher', ''] }, regex: safeQ, options: 'i' } }, 1, 0] },
                ],
              },
            },
          },
          { $sort: { relevanceScore: -1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]);
    let books = await bookQuery;
    books = await Book.populate(books, [
      { path: 'category', select: 'name slug icon' },
      { path: 'university', select: 'name code domain city state' },
      { path: 'seller', select: 'name avatar isVerified department yearOfStudy rating' },
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      status: 'success',
      books,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated filter metadata for marketplace sidebars
 * GET /api/books/filters-meta
 * Access: Public
 */
export const getFiltersMeta = async (req, res, next) => {
  try {
    const matchStage = { status: { $in: ['approved', 'available'] } };

    // 1. Category counts with details
    const categoryCountsRaw = await Book.aggregate([
      { $match: matchStage },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          count: 1,
          name: '$categoryDoc.name',
          slug: '$categoryDoc.slug',
          icon: '$categoryDoc.icon',
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 2. Condition counts
    const conditionCountsRaw = await Book.aggregate([
      { $match: matchStage },
      { $group: { _id: '$condition', count: { $sum: 1 } } },
    ]);
    const conditionCounts = {
      New: 0,
      'Like New': 0,
      Good: 0,
      Fair: 0,
      Poor: 0,
    };
    conditionCountsRaw.forEach((item) => {
      if (item._id && conditionCounts[item._id] !== undefined) {
        conditionCounts[item._id] = item.count;
      }
    });

    // 3. Listing Type counts
    const listingTypeCountsRaw = await Book.aggregate([
      { $match: matchStage },
      { $group: { _id: '$listingType', count: { $sum: 1 } } },
    ]);
    const listingTypeCounts = {
      sell: 0,
      exchange: 0,
      donate: 0,
    };
    listingTypeCountsRaw.forEach((item) => {
      if (item._id === 'sell') listingTypeCounts.sell += item.count;
      else if (item._id === 'donate') listingTypeCounts.donate += item.count;
      else if (item._id === 'exchange') listingTypeCounts.exchange += item.count;
    });

    // 4. Price range among approved sale listings
    const priceStatsRaw = await Book.aggregate([
      {
        $match: {
          ...matchStage,
          $or: [{ sellingPrice: { $gt: 0 } }, { price: { $gt: 0 } }],
        },
      },
      {
        $project: {
          effectivePrice: {
            $cond: {
              if: { $gt: ['$sellingPrice', 0] },
              then: '$sellingPrice',
              else: '$price',
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$effectivePrice' },
          maxPrice: { $max: '$effectivePrice' },
        },
      },
    ]);

    const priceRange = {
      minPrice: priceStatsRaw[0]?.minPrice ?? 0,
      maxPrice: priceStatsRaw[0]?.maxPrice ?? 100,
    };

    const totalApproved = await Book.countDocuments(matchStage);

    res.status(200).json({
      status: 'success',
      totalApproved,
      categoryCounts: categoryCountsRaw,
      conditionCounts,
      listingTypeCounts,
      priceRange,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new book listing
 * POST /api/books
 * Access: Private (Authenticated user)
 */
export const createBook = async (req, res, next) => {
  try {
    const {
      title,
      author,
      isbn,
      edition,
      publisher,
      publicationYear,
      category,
      subject,
      course,
      semester,
      university,
      condition,
      originalPrice,
      sellingPrice,
      listingType,
      description,
      exchangePreferences,
    } = req.body;

    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return next(new AppError('The selected Category does not exist', 400));
    }

    // Determine university
    const targetUniId = university || req.user.university?._id || req.user.university;
    if (!targetUniId) {
      return next(
        new AppError('University is required. Please select your campus.', 400)
      );
    }

    const universityDoc = await University.findById(targetUniId);
    if (!universityDoc) {
      return next(new AppError('The selected University does not exist', 400));
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'campusbook/books')
      );
      const uploadedImages = await Promise.all(uploadPromises);
      uploadedImages.forEach((img) => images.push(img));
    }

    // Determine prices based on listing type
    const isSellListing = listingType === 'sell';
    const finalSellingPrice = isSellListing ? Number(sellingPrice || 0) : 0;
    const finalOriginalPrice = Number(originalPrice || 0);

    const newBook = await Book.create({
      title,
      author,
      isbn: isbn || '',
      edition: edition || '1st Edition',
      publisher: publisher || '',
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      category: categoryDoc._id,
      subject: subject || '',
      course: course || '',
      semester: semester || '',
      university: universityDoc._id,
      seller: req.user._id,
      condition,
      listingType,
      sellingPrice: finalSellingPrice,
      price: finalSellingPrice,
      originalPrice: finalOriginalPrice,
      description,
      images,
      exchangePreferences: exchangePreferences || '',
      status: 'pending', // Default listing status as specified
      isApproved: false,
    });

    const populatedBook = await Book.findById(newBook._id)
      .populate('seller', 'name email avatar rating isVerified department yearOfStudy')
      .populate('category', 'name slug icon')
      .populate('university', 'name code domain city state');

    res.status(201).json({
      status: 'success',
      message: 'Book listed successfully. It is pending administrator review.',
      book: populatedBook,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's book listings (all statuses: pending, available, sold, etc.)
 * GET /api/books/my
 * Access: Private (Authenticated user)
 */
export const getMyBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ seller: req.user._id })
      .populate('category', 'name slug icon')
      .populate('university', 'name code domain')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: books.length,
      books,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single book listing by ID
 * GET /api/books/:id
 * Access: Public for approved/available books; Owner or Admin for any status
 */
export const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('seller', 'name email avatar rating totalRatings isVerified department yearOfStudy')
      .populate('category', 'name slug description icon')
      .populate('university', 'name code domain city state campuses');

    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    const isPublic = ['approved', 'available', 'sold'].includes(book.status);
    const isOwner =
      req.user && book.seller && book.seller._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    // If not public, only owner or admin can view
    if (!isPublic && !isOwner && !isAdmin) {
      return next(
        new AppError(
          'This book listing is pending review or not publicly available.',
          403
        )
      );
    }

    // Atomically increment views count
    const viewUpdates = [Book.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })];
    if (req.user && !isOwner && isPublic) {
      viewUpdates.push(
        UserBookView.findOneAndUpdate(
          { user: req.user._id, book: book._id },
          { $set: { lastViewedAt: new Date() } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      );
    }
    await Promise.all(viewUpdates);
    book.views = (book.views || 0) + 1;

    // Check if the current logged-in user has wishlisted this book
    let isWishlisted = false;
    if (req.user) {
      const exists = await Wishlist.exists({
        user: req.user._id,
        book: book._id,
      });
      isWishlisted = Boolean(exists);
    }

    const bookObj = book.toObject();
    bookObj.isWishlisted = isWishlisted;
    if (bookObj.seller && typeof bookObj.seller === 'object') {
      bookObj.seller.rating = bookObj.seller.rating ?? 5.0;
      bookObj.seller.totalRatings = bookObj.seller.totalRatings ?? 0;
    }

    res.status(200).json({
      status: 'success',
      book: bookObj,
      isWishlisted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get up to 6 similar approved books in the same category or subject
 * GET /api/books/:id/similar
 * Access: Public
 */
export const getSimilarBooks = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid book ID format', 400));
    }

    const sourceBook = await Book.findById(id);
    if (!sourceBook) {
      return next(new AppError('Book listing not found', 404));
    }

    const conditions = [];
    if (sourceBook.category) {
      conditions.push({ category: sourceBook.category });
    }
    if (sourceBook.subject && sourceBook.subject.trim()) {
      conditions.push({
        subject: { $regex: new RegExp(`^${sourceBook.subject.trim()}$`, 'i') },
      });
    }

    const matchFilter = {
      _id: { $ne: sourceBook._id },
      status: { $in: ['approved', 'available'] },
    };

    if (conditions.length > 0) {
      matchFilter.$or = conditions;
    }

    let similarBooks = await Book.find(matchFilter)
      .limit(6)
      .sort({ views: -1, createdAt: -1 })
      .populate('category', 'name slug icon')
      .populate('university', 'name code domain city state')
      .populate('seller', 'name avatar rating totalRatings isVerified');

    // If fewer than 6, supplement with other approved books
    if (similarBooks.length < 6) {
      const excludeIds = [sourceBook._id, ...similarBooks.map((b) => b._id)];
      const fillBooks = await Book.find({
        _id: { $nin: excludeIds },
        status: { $in: ['approved', 'available'] },
      })
        .limit(6 - similarBooks.length)
        .sort({ createdAt: -1 })
        .populate('category', 'name slug icon')
        .populate('university', 'name code domain city state')
        .populate('seller', 'name avatar rating totalRatings isVerified');

      similarBooks = [...similarBooks, ...fillBooks];
    }

    res.status(200).json({
      status: 'success',
      results: similarBooks.length,
      books: similarBooks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing book listing
 * PUT /api/books/:id
 * Access: Private (Owner only)
 */
export const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    // Owner check
    if (book.seller.toString() !== req.user._id.toString()) {
      return next(
        new AppError('Forbidden: You can only update your own book listings', 403)
      );
    }

    // 1. Handle image removal if requested
    let remainingImages = Array.isArray(book.images) ? [...book.images] : [];
    let removeImages = req.body.removeImages;

    if (removeImages) {
      let idsToRemove = [];
      if (Array.isArray(removeImages)) {
        idsToRemove = removeImages;
      } else if (typeof removeImages === 'string') {
        try {
          idsToRemove = JSON.parse(removeImages);
        } catch {
          idsToRemove = removeImages.split(',').map((s) => s.trim());
        }
      }

      if (Array.isArray(idsToRemove) && idsToRemove.length > 0) {
        for (const item of remainingImages) {
          const itemKey = typeof item === 'object' ? item.public_id || item.url : item;
          if (idsToRemove.includes(itemKey) || (item.url && idsToRemove.includes(item.url))) {
            if (typeof item === 'object' && item.public_id) {
              await deleteFromCloudinary(item.public_id);
            }
          }
        }

        remainingImages = remainingImages.filter((item) => {
          const itemKey = typeof item === 'object' ? item.public_id || item.url : item;
          return !idsToRemove.includes(itemKey) && (!item.url || !idsToRemove.includes(item.url));
        });
      }
    }

    // 2. Handle new image uploads
    if (req.files && req.files.length > 0) {
      const totalImagesCount = remainingImages.length + req.files.length;
      if (totalImagesCount > 5) {
        return next(
          new AppError(
            `Total images cannot exceed 5. Currently have ${remainingImages.length}, attempting to add ${req.files.length}.`,
            400
          )
        );
      }

      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, 'campusbook/books')
      );
      const newUploaded = await Promise.all(uploadPromises);
      remainingImages.push(...newUploaded);
    }

    book.images = remainingImages;

    // 3. Update text and numeric fields
    const allowedFields = [
      'title',
      'author',
      'isbn',
      'edition',
      'publisher',
      'publicationYear',
      'category',
      'subject',
      'course',
      'semester',
      'condition',
      'listingType',
      'originalPrice',
      'sellingPrice',
      'description',
      'exchangePreferences',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    });

    // Ensure price sync
    if (book.listingType !== 'sell') {
      book.sellingPrice = 0;
      book.price = 0;
    } else if (req.body.sellingPrice !== undefined) {
      book.sellingPrice = Number(req.body.sellingPrice);
      book.price = Number(req.body.sellingPrice);
    }

    await book.save();

    const updatedBook = await Book.findById(book._id)
      .populate('seller', 'name email avatar rating isVerified department yearOfStudy')
      .populate('category', 'name slug icon')
      .populate('university', 'name code domain');

    res.status(200).json({
      status: 'success',
      message: 'Book listing updated successfully',
      book: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a book listing and remove associated Cloudinary images
 * DELETE /api/books/:id
 * Access: Private (Owner or Admin)
 */
export const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    // Owner or admin check
    const isOwner = book.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(
        new AppError('Forbidden: You do not have permission to delete this listing', 403)
      );
    }

    // Delete all images associated with this book from Cloudinary
    if (Array.isArray(book.images)) {
      const deletePromises = book.images
        .filter((img) => typeof img === 'object' && img.public_id)
        .map((img) => deleteFromCloudinary(img.public_id));
      await Promise.all(deletePromises);
    }

    // Delete record from database
    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Book listing and associated images deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a book listing as sold
 * PATCH /api/books/:id/mark-sold
 * Access: Private (Owner only)
 */
export const markSold = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return next(new AppError('Book listing not found', 404));
    }

    // Owner check
    if (book.seller.toString() !== req.user._id.toString()) {
      return next(
        new AppError('Forbidden: You can only mark your own book listings as sold', 403)
      );
    }

    book.status = 'sold';
    await book.save();

    res.status(200).json({
      status: 'success',
      message: 'Book marked as sold successfully',
      book,
    });
  } catch (error) {
    next(error);
  }
};
