import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schema for creating a book listing
 */
export const createBookSchema = z
  .object({
    title: z
      .string({ required_error: 'Book title is required' })
      .trim()
      .min(2, 'Title must be at least 2 characters long')
      .max(200, 'Title cannot exceed 200 characters'),
    author: z
      .string({ required_error: 'Author name is required' })
      .trim()
      .min(2, 'Author must be at least 2 characters long')
      .max(120, 'Author cannot exceed 120 characters'),
    isbn: z.string().trim().max(32).optional().default(''),
    category: z
      .string({ required_error: 'Category is required' })
      .refine((val) => objectIdRegex.test(val), {
        message: 'Invalid Category ID format',
      }),
    subject: z.string().trim().max(120).optional().default(''),
    course: z.string().trim().max(120).optional().default(''),
    semester: z.string().trim().max(60).optional().default(''),
    university: z
      .string()
      .refine((val) => !val || objectIdRegex.test(val), {
        message: 'Invalid University ID format',
      })
      .optional(),
    condition: z.enum(['New', 'Like New', 'Good', 'Fair', 'Poor'], {
      errorMap: () => ({
        message: 'Condition must be New, Like New, Good, Fair, or Poor',
      }),
    }),
    originalPrice: z.coerce
      .number({ invalid_type_error: 'Original price must be a number' })
      .min(0, 'Original price cannot be negative'),
    sellingPrice: z.coerce
      .number({ invalid_type_error: 'Selling price must be a number' })
      .min(0, 'Selling price cannot be negative'),
    listingType: z.enum(['sell', 'exchange', 'donate'], {
      errorMap: () => ({
        message: 'Listing type must be sell, exchange, or donate',
      }),
    }),
    description: z
      .string({ required_error: 'Book description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters long')
      .max(2500, 'Description cannot exceed 2500 characters'),
    exchangePreferences: z.string().trim().max(500).optional().default(''),
    edition: z.string().trim().max(80).optional().default('1st Edition'),
    publisher: z.string().trim().max(150).optional().default(''),
    publicationYear: z.coerce.number().int().min(0).max(2100).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const isNonSaleListing = data.listingType !== 'sell';

    if (isNonSaleListing && data.sellingPrice > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sellingPrice'],
        message: 'Selling price must be 0 for exchange and donation listings',
      });
    }

    // Rule: sellingPrice cannot exceed originalPrice
    if (!isNonSaleListing && data.sellingPrice > data.originalPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sellingPrice'],
        message: 'Selling price cannot be greater than original price',
      });
    }
  });

/**
 * Validation schema for updating a book listing
 */
export const updateBookSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    author: z.string().trim().min(2).max(120).optional(),
    isbn: z.string().trim().max(32).optional(),
    category: z
      .string()
      .refine((val) => objectIdRegex.test(val), {
        message: 'Invalid Category ID format',
      })
      .optional(),
    subject: z.string().trim().max(120).optional(),
    course: z.string().trim().max(120).optional(),
    semester: z.string().trim().max(60).optional(),
    university: z
      .string()
      .refine((val) => objectIdRegex.test(val), {
        message: 'Invalid University ID format',
      })
      .optional(),
    condition: z.enum(['New', 'Like New', 'Good', 'Fair', 'Poor']).optional(),
    originalPrice: z.coerce.number().min(0).optional(),
    sellingPrice: z.coerce.number().min(0).optional(),
    listingType: z.enum(['sell', 'exchange', 'donate']).optional(),
    description: z.string().trim().min(10).max(2500).optional(),
    exchangePreferences: z.string().trim().max(500).optional(),
    edition: z.string().trim().max(80).optional(),
    publisher: z.string().trim().max(150).optional(),
    publicationYear: z.coerce.number().int().min(0).max(2100).optional(),
    status: z
      .enum(['pending', 'available', 'approved', 'reserved', 'sold', 'exchanged', 'donated'])
      .optional(),
    removeImages: z.union([
      z.array(z.string().max(2048)).max(5),
      z.string().max(12000),
    ]).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const isNonSaleListing = data.listingType !== undefined && data.listingType !== 'sell';

    if (isNonSaleListing && data.sellingPrice !== undefined && data.sellingPrice > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sellingPrice'],
        message: 'Selling price must be 0 for exchange and donation listings',
      });
    }

    if (
      !isNonSaleListing &&
      data.sellingPrice !== undefined &&
      data.originalPrice !== undefined &&
      data.sellingPrice > data.originalPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sellingPrice'],
        message: 'Selling price cannot be greater than original price',
      });
    }
  });

/**
 * Express middleware to validate book creation payload
 */
export const validateCreateBook = (req, res, next) => {
  const result = createBookSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return next(new AppError(`Validation error: ${errors.join('; ')}`, 400));
  }

  // Assign cleaned & coerced values back to req.body
  req.body = { ...req.body, ...result.data };
  next();
};

/**
 * Express middleware to validate book update payload
 */
export const validateUpdateBook = (req, res, next) => {
  const result = updateBookSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return next(new AppError(`Validation error: ${errors.join('; ')}`, 400));
  }

  req.body = { ...req.body, ...result.data };
  next();
};
