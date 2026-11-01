import mongoose from 'mongoose';
import {
  Book,
  Cart,
  Category,
  DonationRequest,
  ExchangeRequest,
  Order,
  University,
  User,
  Wishlist,
} from '../models/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { createNotification } from '../utils/notifications.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const countGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const monthlyCounts = async (Model, startDate, endDate, match = {}) => {
  const rows = await Model.aggregate([
    { $match: { ...match, createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return new Map(rows.map((row) => [row._id, row.count]));
};

export const getAdminStats = async () => {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 30 * DAY_MS);
  const previousStart = new Date(now.getTime() - 60 * DAY_MS);
  const [
    totalStudents,
    totalBooks,
    pendingApprovals,
    totalOrders,
    totalExchanges,
    totalDonations,
    completedOrders,
    revenue,
    userGrowth,
    bookGrowth,
    orderGrowth,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Book.countDocuments(),
    Book.countDocuments({ status: 'pending' }),
    Order.countDocuments(),
    ExchangeRequest.countDocuments(),
    DonationRequest.countDocuments(),
    Order.countDocuments({
      $or: [{ status: 'completed' }, { orderStatus: 'completed' }],
    }),
    Order.aggregate([
      { $match: { $or: [{ status: 'completed' }, { orderStatus: 'completed' }] } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', '$price'] } } } },
    ]),
    Promise.all([
      User.countDocuments({ role: 'student', createdAt: { $gte: currentStart, $lte: now } }),
      User.countDocuments({ role: 'student', createdAt: { $gte: previousStart, $lt: currentStart } }),
    ]),
    Promise.all([
      Book.countDocuments({ createdAt: { $gte: currentStart, $lte: now } }),
      Book.countDocuments({ createdAt: { $gte: previousStart, $lt: currentStart } }),
    ]),
    Promise.all([
      Order.countDocuments({ createdAt: { $gte: currentStart, $lte: now } }),
      Order.countDocuments({ createdAt: { $gte: previousStart, $lt: currentStart } }),
    ]),
  ]);

  return {
    totalStudents,
    totalBooks,
    pendingApprovals,
    totalOrders,
    totalExchanges,
    totalDonations,
    completedOrders,
    totalRevenueValue: revenue[0]?.total || 0,
    growth: {
      students: countGrowth(userGrowth[0], userGrowth[1]),
      books: countGrowth(bookGrowth[0], bookGrowth[1]),
      orders: countGrowth(orderGrowth[0], orderGrowth[1]),
    },
  };
};

export const getActivityAnalytics = async (months) => {
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startDate = new Date(Date.UTC(
    currentMonthStart.getUTCFullYear(),
    currentMonthStart.getUTCMonth() - months + 1,
    1
  ));
  const [userCounts, bookCounts, orderCounts] = await Promise.all([
    monthlyCounts(User, startDate, now),
    monthlyCounts(Book, startDate, now),
    monthlyCounts(Order, startDate, now),
  ]);

  const activity = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    return {
      month: key,
      newUsers: userCounts.get(key) || 0,
      newBooks: bookCounts.get(key) || 0,
      orders: orderCounts.get(key) || 0,
    };
  });

  return { months: activity };
};

export const getCategoryAnalytics = async () => {
  const rows = await Book.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    {
      $lookup: {
        from: Category.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    },
    { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        name: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
        count: 1,
      },
    },
    { $sort: { count: -1, name: 1 } },
  ]);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const top = rows.slice(0, 6);
  const othersCount = rows.slice(6).reduce((sum, row) => sum + row.count, 0);
  const categories = top.map((row) => ({
    ...row,
    percentage: total ? Number(((row.count / total) * 100).toFixed(2)) : 0,
  }));
  categories.push({
    categoryId: null,
    name: 'Others',
    count: othersCount,
    percentage: total ? Number(((othersCount / total) * 100).toFixed(2)) : 0,
  });
  return { totalBooks: total, categories };
};

const universityPipeline = (localField, match = {}) => [
  { $match: match },
  { $group: { _id: `$${localField}`, count: { $sum: 1 } } },
  {
    $lookup: {
      from: University.collection.name,
      localField: '_id',
      foreignField: '_id',
      as: 'universityInfo',
    },
  },
  { $unwind: { path: '$universityInfo', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      universityId: '$_id',
      university: { $ifNull: ['$universityInfo.name', 'Unknown university'] },
      count: 1,
    },
  },
  { $sort: { count: -1, university: 1 } },
  { $limit: 10 },
];

export const getUniversityAnalytics = async () => {
  const [users, books] = await Promise.all([
    User.aggregate(universityPipeline('university')),
    Book.aggregate(universityPipeline('university')),
  ]);
  return { topByUsers: users, topByBooks: books };
};

export const getRecentAdminActivity = async () => {
  const [signups, pendingBooks, orders] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role university avatar isVerified createdAt')
      .populate('university', 'name code')
      .lean(),
    Book.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title author listingType sellingPrice originalPrice images seller university createdAt status')
      .populate('seller', 'name email')
      .populate('university', 'name code')
      .lean(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber buyer seller book price amount status orderStatus createdAt')
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('book', 'title listingType sellingPrice images')
      .lean(),
  ]);

  return { signups, pendingBooks, orders };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pagination = ({ page = 1, limit = 20 } = {}) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    throw new AppError('page must be a positive integer.', 400);
  }
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new AppError('limit must be an integer between 1 and 100.', 400);
  }
  return { page: parsedPage, limit: parsedLimit, skip: (parsedPage - 1) * parsedLimit };
};

const validateSearch = (query) => {
  for (const key of ['q', 'status', 'role']) {
    if (query[key] !== undefined && typeof query[key] !== 'string') {
      throw new AppError(`${key} must be a single string value.`, 400);
    }
  }
};

const paginatedResult = (items, total, page, limit) => ({
  results: items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

const validId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${label} ID.`, 400);
};

const ensureUnique = async (Model, field, value, excludeId) => {
  const normalized = value.trim();
  const filter = { [field]: { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' } };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Model.exists(filter)) {
    throw new AppError(`A ${Model.modelName.toLowerCase()} with this ${field} already exists.`, 409);
  }
};

export const getAdminUsers = async (query) => {
  validateSearch(query);
  const { page, limit, skip } = pagination(query);
  const filter = {};
  if (query.q?.trim()) {
    const pattern = new RegExp(escapeRegex(query.q.trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }
  if (query.role) {
    if (!['student', 'admin'].includes(query.role)) throw new AppError('role must be student or admin.', 400);
    filter.role = query.role;
  }
  if (query.status) {
    if (query.status === 'blocked') filter.isBlocked = true;
    else {
      if (!['active', 'suspended', 'pending'].includes(query.status)) {
        throw new AppError('status must be active, suspended, pending, or blocked.', 400);
      }
      filter.status = query.status;
      filter.isBlocked = { $ne: true };
    }
  }
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role university status isBlocked isVerified avatar createdAt')
      .populate('university', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return paginatedResult(users, total, page, limit);
};

const getStudentUser = async (id) => {
  validId(id, 'user');
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') throw new AppError('Administrators cannot be modified by this action.', 403);
  return user;
};

export const setAdminUserBlocked = async (id, isBlocked, adminId) => {
  if (id === adminId.toString()) throw new AppError('You cannot block or unblock your own account.', 400);
  const user = await getStudentUser(id);
  user.isBlocked = isBlocked;
  await user.save();
  await user.populate('university', 'name code');
  return user;
};

export const verifyAdminUser = async (id) => {
  const user = await getStudentUser(id);
  user.isVerified = true;
  await user.save();
  await user.populate('university', 'name code');
  return user;
};

export const getAdminBooks = async (query) => {
  validateSearch(query);
  const { page, limit, skip } = pagination(query);
  const filter = {};
  if (query.status) {
    const statuses = ['pending', 'available', 'approved', 'reserved', 'sold', 'exchanged', 'donated', 'rejected'];
    if (!statuses.includes(query.status)) throw new AppError(`status must be one of: ${statuses.join(', ')}.`, 400);
    filter.status = query.status;
  }
  if (query.q?.trim()) {
    const pattern = new RegExp(escapeRegex(query.q.trim()), 'i');
    filter.$or = [{ title: pattern }, { author: pattern }, { isbn: pattern }];
  }
  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate('seller', 'name email avatar')
      .populate('university', 'name code')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Book.countDocuments(filter),
  ]);
  return paginatedResult(books, total, page, limit);
};

const getBook = async (id) => {
  validId(id, 'book');
  const book = await Book.findById(id);
  if (!book) throw new AppError('Book listing not found.', 404);
  return book;
};

export const approveAdminBook = async (id, io) => {
  const book = await getBook(id);
  if (book.status !== 'pending') throw new AppError('Only pending book listings can be approved.', 400);
  book.status = 'approved';
  book.isApproved = true;
  book.rejectionReason = '';
  await book.save();
  await createNotification({
    user: book.seller,
    type: 'book_status',
    title: 'Book listing approved',
    message: `Your listing “${book.title}” has been approved and is now visible in the marketplace.`,
    ids: { bookId: book._id },
    io,
  });
  return book;
};

export const rejectAdminBook = async (id, reason, io) => {
  const book = await getBook(id);
  if (book.status !== 'pending') throw new AppError('Only pending book listings can be rejected.', 400);
  book.status = 'rejected';
  book.isApproved = false;
  book.rejectionReason = reason?.trim() || 'The listing did not meet marketplace requirements.';
  await book.save();
  await createNotification({
    user: book.seller,
    type: 'book_status',
    title: 'Book listing rejected',
    message: `Your listing “${book.title}” was rejected. Reason: ${book.rejectionReason}`,
    ids: { bookId: book._id },
    io,
  });
  return book;
};

export const deleteAdminBook = async (id) => {
  const book = await getBook(id);
  const images = Array.isArray(book.images) ? book.images : [];
  const imageResults = await Promise.all(
    images
      .filter((image) => image && typeof image === 'object' && image.public_id)
      .map((image) => deleteFromCloudinary(image.public_id))
  );
  const failures = imageResults.filter((result) => result?.result === 'error');
  if (failures.length) {
    throw new AppError(`Unable to remove ${failures.length} book image(s) from Cloudinary; listing was not deleted.`, 502);
  }
  await Promise.all([
    Wishlist.deleteMany({ book: book._id }),
    Cart.updateMany({}, { $pull: { items: { book: book._id } } }),
  ]);
  await book.deleteOne();
  return { bookId: id };
};

const searchUserIds = async (search) => {
  if (!search?.trim()) return null;
  const pattern = new RegExp(escapeRegex(search.trim()), 'i');
  return (await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id').lean())
    .map((user) => user._id);
};

const searchBookIds = async (search) => {
  if (!search?.trim()) return null;
  const pattern = new RegExp(escapeRegex(search.trim()), 'i');
  return (await Book.find({ $or: [{ title: pattern }, { author: pattern }, { isbn: pattern }] }).select('_id').lean())
    .map((book) => book._id);
};

const requestStatusFilter = (status, allowed) => {
  if (!status) return {};
  if (!allowed.includes(status)) throw new AppError(`status must be one of: ${allowed.join(', ')}.`, 400);
  return { status };
};

const listAdminRequests = async ({ Model, query, allowedStatuses, populate, searchFields }) => {
  validateSearch(query);
  const { page, limit, skip } = pagination(query);
  const filter = requestStatusFilter(query.status, allowedStatuses);
  if (Model === Order && query.status) {
    filter.$or = [{ status: query.status }, { orderStatus: query.status }];
    delete filter.status;
  }
  if (query.q?.trim()) {
    const [userIds, bookIds] = await Promise.all([searchUserIds(query.q), searchBookIds(query.q)]);
    const searchConditions = searchFields(userIds || [], bookIds || []);
    if (!searchConditions.length) return paginatedResult([], 0, page, limit);
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }
  const [items, total] = await Promise.all([
    Model.find(filter).populate(populate).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  return paginatedResult(items, total, page, limit);
};

const requestPaginationDefaults = (query) => ({
  page: query.page === undefined ? 1 : query.page,
  limit: query.limit === undefined ? 20 : query.limit,
});

export const getAdminOrders = (query) => listAdminRequests({
  Model: Order,
  query: requestPaginationDefaults(query),
  allowedStatuses: ['placed', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'],
  populate: [
    { path: 'buyer', select: 'name email avatar' },
    { path: 'seller', select: 'name email avatar' },
    { path: 'book', select: 'title author listingType sellingPrice images' },
  ],
  searchFields: (userIds, bookIds) => [
    { orderNumber: new RegExp(escapeRegex(query.q.trim()), 'i') },
    ...(userIds.length ? [{ $or: [{ buyer: { $in: userIds } }, { seller: { $in: userIds } }] }] : []),
    ...(bookIds.length ? [{ book: { $in: bookIds } }] : []),
  ],
});

export const getAdminExchanges = (query) => listAdminRequests({
  Model: ExchangeRequest,
  query: requestPaginationDefaults(query),
  allowedStatuses: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
  populate: [
    { path: 'requester', select: 'name email avatar' },
    { path: 'bookOwner', select: 'name email avatar' },
    { path: 'requestedBook', select: 'title author images status listingType' },
    { path: 'offeredBook', select: 'title author images status listingType' },
  ],
  searchFields: (userIds, bookIds) => [
    ...(userIds.length ? [{ $or: [{ requester: { $in: userIds } }, { bookOwner: { $in: userIds } }] }] : []),
    ...(bookIds.length ? [{ $or: [{ requestedBook: { $in: bookIds } }, { offeredBook: { $in: bookIds } }] }] : []),
  ],
});

export const getAdminDonations = (query) => listAdminRequests({
  Model: DonationRequest,
  query: requestPaginationDefaults(query),
  allowedStatuses: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
  populate: [
    { path: 'requester', select: 'name email avatar' },
    { path: 'donor', select: 'name email avatar' },
    { path: 'book', select: 'title author images status listingType' },
  ],
  searchFields: (userIds, bookIds) => [
    ...(userIds.length ? [{ $or: [{ requester: { $in: userIds } }, { donor: { $in: userIds } }] }] : []),
    ...(bookIds.length ? [{ book: { $in: bookIds } }] : []),
  ],
});

export const listAdminCategories = async () => Category.find().sort({ name: 1 }).lean();

export const getAdminCategory = async (id) => {
  validId(id, 'category');
  const category = await Category.findById(id).lean();
  if (!category) throw new AppError('Category not found.', 404);
  return category;
};

const validateCategoryFields = (data) => {
  for (const field of ['name', 'slug', 'description', 'icon']) {
    if (data[field] !== undefined && typeof data[field] !== 'string') {
      throw new AppError(`${field} must be a string.`, 400);
    }
  }
  if (data.description?.length > 300) throw new AppError('Category description cannot exceed 300 characters.', 400);
  if (data.icon?.length > 80) throw new AppError('Category icon cannot exceed 80 characters.', 400);
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    throw new AppError('isActive must be a boolean.', 400);
  }
};

export const createAdminCategory = async (data) => {
  validateCategoryFields(data);
  const name = data.name?.trim();
  if (!name || name.length < 2 || name.length > 80) throw new AppError('Category name must be between 2 and 80 characters.', 400);
  await ensureUnique(Category, 'name', name);
  const slug = (data.slug?.trim() || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) throw new AppError('A valid category slug is required.', 400);
  await ensureUnique(Category, 'slug', slug);
  return Category.create({ name, slug, description: data.description || '', icon: data.icon || 'book-open' });
};

export const updateAdminCategory = async (id, data) => {
  validateCategoryFields(data);
  validId(id, 'category');
  const category = await Category.findById(id);
  if (!category) throw new AppError('Category not found.', 404);
  if (data.name !== undefined) {
    const name = data.name.trim();
    if (name.length < 2 || name.length > 80) throw new AppError('Category name must be between 2 and 80 characters.', 400);
    await ensureUnique(Category, 'name', name, category._id);
    category.name = name;
  }
  if (data.slug !== undefined || data.name !== undefined) {
    const source = data.slug?.trim() || category.name;
    const slug = source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) throw new AppError('A valid category slug is required.', 400);
    await ensureUnique(Category, 'slug', slug, category._id);
    category.slug = slug;
  }
  for (const field of ['description', 'icon', 'isActive']) {
    if (data[field] !== undefined) category[field] = data[field];
  }
  await category.save();
  return category;
};

export const deleteAdminCategory = async (id) => {
  validId(id, 'category');
  const category = await Category.findById(id);
  if (!category) throw new AppError('Category not found.', 404);
  if (await Book.exists({ category: category._id })) {
    throw new AppError('Cannot delete this category because books are using it.', 409);
  }
  await category.deleteOne();
};

export const listAdminUniversities = async () => University.find().sort({ name: 1 }).lean();

export const getAdminUniversity = async (id) => {
  validId(id, 'university');
  const university = await University.findById(id).lean();
  if (!university) throw new AppError('University not found.', 404);
  return university;
};

const validateUniversityData = (data, existing = {}) => {
  const fields = ['name', 'code', 'domain', 'city', 'country'];
  const values = { ...existing, ...data };
  for (const field of fields) {
    if (typeof values[field] !== 'string' || !values[field].trim()) {
      throw new AppError(`${field} is required.`, 400);
    }
    for (const field of ['state', 'domain', 'code']) {
      if (values[field] !== undefined && typeof values[field] !== 'string') {
        throw new AppError(`${field} must be a string.`, 400);
      }
    }
    if (values.campuses !== undefined && (!Array.isArray(values.campuses) || values.campuses.some((campus) => typeof campus !== 'string'))) {
      throw new AppError('campuses must be an array of strings.', 400);
    }
    if (values.isActive !== undefined && typeof values.isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean.', 400);
    }
  }
  if (values.name.trim().length > 150) throw new AppError('University name cannot exceed 150 characters.', 400);
  if (values.code.trim().length > 20) throw new AppError('University code cannot exceed 20 characters.', 400);
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    domain: values.domain.trim().toLowerCase(),
    city: values.city.trim(),
    state: values.state?.trim() || '',
    country: values.country.trim(),
    campuses: Array.isArray(values.campuses) ? values.campuses : [],
    ...(values.isActive !== undefined ? { isActive: values.isActive } : {}),
  };
};

export const createAdminUniversity = async (data) => {
  const fields = validateUniversityData(data);
  await ensureUnique(University, 'name', fields.name);
  await ensureUnique(University, 'code', fields.code);
  await ensureUnique(University, 'domain', fields.domain);
  return University.create(fields);
};

export const updateAdminUniversity = async (id, data) => {
  validId(id, 'university');
  const university = await University.findById(id);
  if (!university) throw new AppError('University not found.', 404);
  const fields = validateUniversityData(data, university.toObject());
  await Promise.all([
    ensureUnique(University, 'name', fields.name, university._id),
    ensureUnique(University, 'code', fields.code, university._id),
    ensureUnique(University, 'domain', fields.domain, university._id),
  ]);
  Object.assign(university, fields);
  await university.save();
  return university;
};

export const deleteAdminUniversity = async (id) => {
  validId(id, 'university');
  const university = await University.findById(id);
  if (!university) throw new AppError('University not found.', 404);
  const [users, books] = await Promise.all([
    User.exists({ university: university._id }),
    Book.exists({ university: university._id }),
  ]);
  if (users || books) throw new AppError('Cannot delete this university because users or books are associated with it.', 409);
  await university.deleteOne();
};

const csvCell = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const csvResponse = (headers, rows) => [
  headers.map(csvCell).join(','),
  ...rows.map((row) => row.map(csvCell).join(',')),
].join('\r\n');

export const exportAdminUsersCsv = async () => {
  const users = await User.find()
    .select('name email role university status isBlocked isVerified createdAt')
    .populate('university', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return csvResponse(
    ['id', 'name', 'email', 'role', 'university', 'status', 'isBlocked', 'isVerified', 'createdAt'],
    users.map((user) => [
      user._id,
      user.name,
      user.email,
      user.role,
      user.university?.name,
      user.status,
      user.isBlocked,
      user.isVerified,
      user.createdAt?.toISOString(),
    ])
  );
};

export const exportAdminOrdersCsv = async () => {
  const orders = await Order.find()
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .populate('book', 'title')
    .sort({ createdAt: -1 })
    .lean();
  return csvResponse(
    ['id', 'orderNumber', 'buyerName', 'buyerEmail', 'sellerName', 'sellerEmail', 'bookTitle', 'price', 'amount', 'status', 'createdAt'],
    orders.map((order) => [
      order._id,
      order.orderNumber,
      order.buyer?.name,
      order.buyer?.email,
      order.seller?.name,
      order.seller?.email,
      order.book?.title,
      order.price,
      order.amount,
      order.status || order.orderStatus,
      order.createdAt?.toISOString(),
    ])
  );
};
