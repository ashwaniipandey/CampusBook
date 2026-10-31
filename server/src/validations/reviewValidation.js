import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createReviewSchema = z.object({
  orderId: z
    .string({ required_error: 'Order ID is required' })
    .refine((val) => objectIdRegex.test(val), {
      message: 'Invalid order ID format',
    }),
  rating: z.coerce
    .number({ required_error: 'Rating is required', invalid_type_error: 'Rating must be a number' })
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .trim()
    .max(1000, 'Comment cannot exceed 1000 characters')
    .optional()
    .default(''),
});

export const validateCreateReview = (req, res, next) => {
  try {
    const validated = createReviewSchema.parse(req.body);
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

