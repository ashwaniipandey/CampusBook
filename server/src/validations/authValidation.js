import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid ID.');
const email = z.string().trim().email('Please provide a valid email address.').max(254).transform((value) => value.toLowerCase());
const password = z.string().min(6, 'Password must be at least 6 characters.').max(128);
const otp = z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit code.');

const indianPhoneRegex = /^[6-9]\d{9}$/;

const schemas = {
  register: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
    email,
    password,
  }).strict(),
  completeProfile: z.object({
    state: z.string().trim().min(1, 'State is required').max(100),
    phone: z.string().trim().regex(indianPhoneRegex, 'Please provide a valid 10-digit Indian mobile number starting with 6-9'),
    city: z.string().trim().max(100).optional(),
    universityId: objectId.optional().or(z.literal('')),
    department: z.string().trim().max(100).optional(),
    course: z.string().trim().max(100).optional(),
    yearOfStudy: z.coerce.number().int().min(1).max(7).optional(),
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
    state: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    universityId: objectId.optional().or(z.literal('')),
    department: z.string().trim().max(100).optional(),
    course: z.string().trim().max(100).optional(),
    yearOfStudy: z.coerce.number().int().min(1).max(7).optional(),
    phone: z.string().trim().regex(indianPhoneRegex, 'Please provide a valid 10-digit Indian mobile number').optional().or(z.literal('')),
    bio: z.string().trim().max(500).optional(),
    avatar: z.string().url().max(2048).optional().or(z.literal('')),
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
