import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler.js';

const objectId = z
  .string()
  .refine(
    (value) => mongoose.Types.ObjectId.isValid(value),
    'Must be a valid ID.',
  );
const nonEmptyText = (limit) => z.string().trim().min(1).max(limit);

const schemas = {
  conversation: z
    .object({
      userId: objectId,
      bookId: objectId.optional().or(z.literal('')),
    })
    .strict(),
  message: z.object({ text: nonEmptyText(2000) }).strict(),
  imageMessage: z
    .object({ text: z.string().trim().max(2000).optional() })
    .strict(),
  exchange: z
    .object({
      requestedBookId: objectId,
      offeredBookId: objectId,
      message: z.string().trim().max(1000).optional().default(''),
    })
    .strict(),
  donation: z
    .object({
      bookId: objectId,
      message: z.string().trim().max(1000).optional().default(''),
    })
    .strict(),
  requestStatus: z
    .object({
      status: z.enum(['accepted', 'rejected', 'cancelled', 'completed']),
    })
    .strict(),
  search: z.object({ term: nonEmptyText(120) }).strict(),
};

const rejectUnknownQueryKeys = (query, allowedKeys) => {
  const unexpected = Object.keys(query).filter(
    (key) => !allowedKeys.includes(key),
  );
  if (unexpected.length) {
    throw new AppError(
      `Unexpected query parameter(s): ${unexpected.join(', ')}.`,
      400,
    );
  }
};

const validatePagination = (query, maxLimit = 100) => {
  for (const [key, maximum] of [
    ['page', 100000],
    ['limit', maxLimit],
  ]) {
    const rawValue = query[key];
    if (rawValue === undefined) continue;
    const value = Number(rawValue);
    if (
      typeof rawValue !== 'string' ||
      !/^\d+$/.test(rawValue) ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > maximum
    ) {
      throw new AppError(
        `${key} must be an integer between 1 and ${maximum}.`,
        400,
      );
    }
  }
};

const validateSearchTerm = (query) => {
  if (
    query.q !== undefined &&
    (typeof query.q !== 'string' || query.q.length > 120)
  ) {
    throw new AppError('q must be a string of 120 characters or fewer.', 400);
  }
};

const adminQueryRules = {
  activity: {
    keys: ['months'],
    validate: (query) => {
      if (
        query.months !== undefined &&
        (typeof query.months !== 'string' ||
          !/^\d+$/.test(query.months) ||
          Number(query.months) < 1 ||
          Number(query.months) > 24)
      ) {
        throw new AppError('months must be an integer between 1 and 24.', 400);
      }
    },
  },
  users: {
    keys: ['page', 'limit', 'q', 'role', 'status'],
    validate: (query) => {
      validatePagination(query);
      validateSearchTerm(query);
      if (
        query.role !== undefined &&
        !['student', 'admin'].includes(query.role)
      ) {
        throw new AppError('role must be student or admin.', 400);
      }
      if (
        query.status !== undefined &&
        !['active', 'suspended', 'pending', 'blocked'].includes(query.status)
      ) {
        throw new AppError(
          'status must be active, suspended, pending, or blocked.',
          400,
        );
      }
    },
  },
  books: {
    keys: ['page', 'limit', 'q', 'status'],
    validate: (query) => {
      validatePagination(query);
      validateSearchTerm(query);
      const statuses = [
        'pending',
        'available',
        'approved',
        'reserved',
        'sold',
        'exchanged',
        'donated',
        'rejected',
      ];
      if (query.status !== undefined && !statuses.includes(query.status)) {
        throw new AppError(
          `status must be one of: ${statuses.join(', ')}.`,
          400,
        );
      }
    },
  },
  orders: {
    keys: ['page', 'limit', 'q', 'status'],
    validate: (query) => {
      validatePagination(query);
      validateSearchTerm(query);
      const statuses = [
        'placed',
        'confirmed',
        'ready_for_pickup',
        'completed',
        'cancelled',
      ];
      if (query.status !== undefined && !statuses.includes(query.status)) {
        throw new AppError(
          `status must be one of: ${statuses.join(', ')}.`,
          400,
        );
      }
    },
  },
  exchanges: {
    keys: ['page', 'limit', 'q', 'status'],
    validate: (query) => {
      validatePagination(query);
      validateSearchTerm(query);
      const statuses = [
        'pending',
        'accepted',
        'rejected',
        'cancelled',
        'completed',
      ];
      if (query.status !== undefined && !statuses.includes(query.status)) {
        throw new AppError(
          `status must be one of: ${statuses.join(', ')}.`,
          400,
        );
      }
    },
  },
  donations: {
    keys: ['page', 'limit', 'q', 'status'],
    validate: (query) => {
      validatePagination(query);
      validateSearchTerm(query);
      const statuses = [
        'pending',
        'accepted',
        'rejected',
        'cancelled',
        'completed',
      ];
      if (query.status !== undefined && !statuses.includes(query.status)) {
        throw new AppError(
          `status must be one of: ${statuses.join(', ')}.`,
          400,
        );
      }
    },
  },
};

export const validateAllowedQuery =
  (allowedKeys = []) =>
  (req, res, next) => {
    try {
      rejectUnknownQueryKeys(req.query, allowedKeys);
      next();
    } catch (error) {
      next(error);
    }
  };

export const validateAdminQuery = (queryType) => (req, res, next) => {
  try {
    const rules = adminQueryRules[queryType];
    if (!rules) throw new Error(`Unknown admin query validator: ${queryType}`);
    rejectUnknownQueryKeys(req.query, rules.keys);
    rules.validate(req.query);
    next();
  } catch (error) {
    next(error);
  }
};

export const validatePagedQuery =
  (allowedKeys, maxLimit = 100) =>
  (req, res, next) => {
    try {
      rejectUnknownQueryKeys(req.query, allowedKeys);
      validatePagination(req.query, maxLimit);
      next();
    } catch (error) {
      next(error);
    }
  };

export const validateRoleQuery = (allowedRoles) => (req, res, next) => {
  try {
    rejectUnknownQueryKeys(req.query, ['role']);
    if (
      req.query.role !== undefined &&
      !allowedRoles.includes(req.query.role)
    ) {
      throw new AppError(
        `role must be one of: ${allowedRoles.join(', ')}.`,
        400,
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateConversationListQuery = (req, res, next) => {
  try {
    rejectUnknownQueryKeys(req.query, ['q']);
    if (
      req.query.q !== undefined &&
      (typeof req.query.q !== 'string' || req.query.q.length > 120)
    ) {
      throw new AppError('q must be a string of 120 characters or fewer.', 400);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateNotificationsQuery = (req, res, next) => {
  try {
    rejectUnknownQueryKeys(req.query, ['page', 'limit', 'unread']);
    validatePagination(req.query, 100);
    if (
      req.query.unread !== undefined &&
      !['true', 'false'].includes(req.query.unread)
    ) {
      throw new AppError('unread must be true or false.', 400);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateBody = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema)
    return next(new Error(`Unknown request validation schema: ${schemaName}`));
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join(', ');
    return next(new AppError(`Validation error: ${message}`, 400));
  }
  req.body = result.data;
  next();
};

export const validateOrderQuery = (req, res, next) => {
  const role = req.query.role;
  const status = req.query.status;
  try {
    rejectUnknownQueryKeys(req.query, ['role', 'status']);
  } catch (error) {
    return next(error);
  }
  if (role !== undefined && !['buying', 'selling'].includes(role)) {
    return next(new AppError('role must be buying or selling.', 400));
  }
  const allowedStatuses = [
    'placed',
    'confirmed',
    'ready_for_pickup',
    'completed',
    'cancelled',
  ];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return next(
      new AppError(
        `status must be one of: ${allowedStatuses.join(', ')}.`,
        400,
      ),
    );
  }
  next();
};

export const validateBookListQuery = (req, res, next) => {
  const { query } = req;
  try {
    rejectUnknownQueryKeys(query, [
      'q',
      'category',
      'university',
      'scope',
      'universityName',
      'condition',
      'listingType',
      'semester',
      'course',
      'edition',
      'publisher',
      'minPrice',
      'maxPrice',
      'sort',
      'page',
      'limit',
    ]);
  } catch (error) {
    return next(error);
  }
  const allowedSorts = [
    'relevance',
    'price_asc',
    'price_desc',
    'popular',
    'newest',
  ];
  if (query.sort !== undefined && !allowedSorts.includes(query.sort)) {
    return next(
      new AppError(`sort must be one of: ${allowedSorts.join(', ')}.`, 400),
    );
  }
  if (query.scope !== undefined && !['mine', 'all'].includes(query.scope)) {
    return next(new AppError('scope must be mine or all.', 400));
  }
  if (
    query.listingType !== undefined &&
    !['sell', 'exchange', 'donate'].includes(query.listingType)
  ) {
    return next(
      new AppError('listingType must be sell, exchange, or donate.', 400),
    );
  }
  if (query.category !== undefined) {
    const categories = (
      Array.isArray(query.category) ? query.category : [query.category]
    ).flatMap((value) => String(value).split(','));
    if (
      categories.length > 20 ||
      categories.some((value) => !mongoose.Types.ObjectId.isValid(value.trim()))
    ) {
      return next(
        new AppError('category must contain valid category IDs.', 400),
      );
    }
  }
  if (
    query.university !== undefined &&
    !mongoose.Types.ObjectId.isValid(query.university)
  ) {
    return next(new AppError('university must be a valid university ID.', 400));
  }
  if (query.condition !== undefined) {
    const conditions = (
      Array.isArray(query.condition) ? query.condition : [query.condition]
    ).flatMap((value) => String(value).split(','));
    const allowed = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
    if (
      conditions.length > 5 ||
      conditions.some((value) => !allowed.includes(value.trim()))
    ) {
      return next(
        new AppError(
          `condition must contain values from: ${allowed.join(', ')}.`,
          400,
        ),
      );
    }
  }
  for (const key of ['page', 'limit']) {
    if (query[key] !== undefined) {
      const value = Number(query[key]);
      const max = key === 'page' ? 100000 : 50;
      if (!Number.isInteger(value) || value < 1 || value > max) {
        return next(
          new AppError(
            `${key} must be a positive integer${key === 'page' ? ' no greater than 100000' : ' no greater than 50'}.`,
            400,
          ),
        );
      }
    }
  }
  const textLimits = {
    q: 120,
    universityName: 150,
    semester: 60,
    course: 100,
    edition: 100,
    publisher: 150,
  };
  for (const [key, maximum] of Object.entries(textLimits)) {
    if (
      query[key] !== undefined &&
      (typeof query[key] !== 'string' || query[key].length > maximum)
    ) {
      return next(
        new AppError(
          `${key} must be a string of ${maximum} characters or fewer.`,
          400,
        ),
      );
    }
  }
  for (const key of ['minPrice', 'maxPrice']) {
    if (query[key] !== undefined) {
      if (typeof query[key] !== 'string' || query[key].trim() === '') {
        return next(new AppError(`${key} must be a non-negative number.`, 400));
      }
      const value = Number(query[key]);
      if (!Number.isFinite(value) || value < 0) {
        return next(new AppError(`${key} must be a non-negative number.`, 400));
      }
    }
  }
  if (
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    Number(query.minPrice) > Number(query.maxPrice)
  ) {
    return next(new AppError('minPrice cannot be greater than maxPrice.', 400));
  }
  next();
};
