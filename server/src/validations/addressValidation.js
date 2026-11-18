import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler.js';

const phoneRegex = /^[6-9]\d{9}$/;
const pincodeRegex = /^[1-9]\d{5}$/;

export const addressSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(phoneRegex, 'Phone number must be exactly 10 digits and start with 6, 7, 8, or 9'),
  pincode: z
    .string({ required_error: 'Pincode is required' })
    .trim()
    .regex(pincodeRegex, 'Pincode must be exactly 6 digits and cannot start with 0'),
  houseNo: z
    .string({ required_error: 'Flat, house no., or building is required' })
    .trim()
    .min(1, 'Flat, house no., or building is required')
    .max(150, 'House details cannot exceed 150 characters'),
  area: z
    .string({ required_error: 'Area, street, or sector is required' })
    .trim()
    .min(1, 'Area, street, or sector is required')
    .max(200, 'Area details cannot exceed 200 characters'),
  landmark: z
    .string()
    .trim()
    .max(150, 'Landmark cannot exceed 150 characters')
    .optional()
    .default(''),
  city: z
    .string({ required_error: 'City is required' })
    .trim()
    .min(1, 'City is required')
    .max(100, 'City cannot exceed 100 characters'),
  state: z
    .string({ required_error: 'State is required' })
    .trim()
    .min(1, 'State is required')
    .max(100, 'State cannot exceed 100 characters'),
  addressType: z
    .enum(['Home', 'Work', 'Campus'], {
      errorMap: () => ({ message: 'Address type must be Home, Work, or Campus' }),
    })
    .default('Home'),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export const validateCreateAddress = (req, res, next) => {
  try {
    const validated = addressSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return next(new AppError(`Validation error: ${messages}`, 400));
    }
    next(error);
  }
};

export const validateUpdateAddress = (req, res, next) => {
  try {
    const validated = updateAddressSchema.parse(req.body);
    req.body = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return next(new AppError(`Validation error: ${messages}`, 400));
    }
    next(error);
  }
};
