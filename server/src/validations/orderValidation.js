import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createOrderSchema = z
  .object({
    bookId: z
      .string()
      .refine((val) => objectIdRegex.test(val), {
        message: 'Invalid book ID format',
      })
      .optional(),
    fromCart: z.boolean().optional(),
    meetingLocation: z
      .string()
      .trim()
      .max(200, 'Meeting location cannot exceed 200 characters')
      .optional()
      .default(''),
    notes: z
      .string()
      .trim()
      .max(500, 'Notes cannot exceed 500 characters')
      .optional()
      .default(''),
  })
  .strict()
  .refine((data) => data.bookId || data.fromCart, {
    message: 'Either bookId or fromCart must be provided',
    path: ['bookId'],
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled'], {
    errorMap: () => ({
      message: 'Status must be one of: confirmed, completed, cancelled',
    }),
  }),
}).strict();

export const validateCreateOrder = (req, res, next) => {
  try {
    const validated = createOrderSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(new AppError(`Validation error: ${messages}`, 400));
    }
    next(error);
  }
};

export const validateUpdateOrderStatus = (req, res, next) => {
  try {
    const validated = updateOrderStatusSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return next(new AppError(`Validation error: ${messages}`, 400));
    }
    next(error);
  }
};
