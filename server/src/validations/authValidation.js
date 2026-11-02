import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ID.');
const email = z.string().trim().email('Please provide a valid email address.').max(254).transform((value) => value.toLowerCase());
const password = z.string().min(6, 'Password must be at least 6 characters.').max(128);
const otp = z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code.');

const schemas = {
  register: z.object({
    name: z.string().trim().min(2).max(60),
    email,
    password,
    universityId: objectId,
    department: z.string().trim().max(100).optional(),
    yearOfStudy: z.coerce.number().int().min(1).max(7).optional(),
    studentId: z.string().trim().max(50).optional(),
    phone: z.string().trim().max(30).optional(),
  }).strict(),
  login: z.object({ email, password: z.string().min(1).max(128) }).strict(),
  google: z.object({ credential: z.string().min(20).max(8192) }).strict(),
  collegeEmail: z.object({ email }).strict(),
  collegeOtp: z.object({ otp }).strict(),
  verifyOtp: z.object({ email, otp }).strict(),
  resendOtp: z.object({ email }).strict(),
  forgotPassword: z.object({ email }).strict(),
  resetPassword: z.object({ email, otp, newPassword: password }).strict(),
  changePassword: z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: password,
  }).strict(),
  profile: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    department: z.string().trim().max(100).optional(),
    yearOfStudy: z.coerce.number().int().min(1).max(7).optional(),
    phone: z.string().trim().max(30).optional(),
    bio: z.string().trim().max(500).optional(),
    avatar: z.string().url().max(2048).optional(),
  }).strict().refine((value) => Object.keys(value).length > 0, 'At least one profile field is required.'),
};

export const validateVerificationBody = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next(new Error(`Unknown verification validation schema: ${schemaName}`));

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

export const validateAuthBody = (schemaName) => (req, res, next) => {
  const schema = schemas[schemaName];
  if (!schema) return next(new Error(`Unknown auth validation schema: ${schemaName}`));

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
