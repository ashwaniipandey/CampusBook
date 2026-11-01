import { z } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../middlewares/errorHandler.js';

const profileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60).optional(),
    phone: z.string().trim().max(30, 'Phone cannot exceed 30 characters').optional(),
    university: z
      .string()
      .refine((value) => mongoose.Types.ObjectId.isValid(value), 'Invalid university ID')
      .optional(),
    course: z.string().trim().max(120, 'Course cannot exceed 120 characters').optional(),
    semester: z.string().trim().max(60, 'Semester cannot exceed 60 characters').optional(),
    bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters').optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one profile field must be provided');

export const validateProfileUpdate = (req, res, next) => {
  try {
    req.body = profileSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join(', ');
      return next(new AppError(`Validation error: ${messages}`, 400));
    }
    next(error);
  }
};
