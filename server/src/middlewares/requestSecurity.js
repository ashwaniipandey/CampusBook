import mongoose from 'mongoose';
import { AppError } from './errorHandler.js';

const protectedTextKeys = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'otp',
  'token',
  'email',
]);

const fieldLimits = {
  bio: 500,
  comment: 1000,
  description: 2500,
  message: 2000,
  notes: 500,
  reason: 500,
};

export const stripHtmlFromText = (value) =>
  value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();

const cleanValue = (value, key = '') => {
  if (typeof value === 'string') {
    if (protectedTextKeys.has(key)) return value;
    const clean = stripHtmlFromText(value);
    const fieldLimit = fieldLimits[key] || 10000;
    if (clean.length > fieldLimit) {
      throw new AppError(`${key || 'Input'} cannot exceed ${fieldLimit} characters.`, 400);
    }
    return clean;
  }
  if (Array.isArray(value)) return value.map((item) => cleanValue(item, key));
  if (value && typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) {
      value[childKey] = cleanValue(childValue, childKey);
    }
  }
  return value;
};

const validateQueryShape = (value, key = 'query') => {
  if (Array.isArray(value)) {
    if (value.length > 20) throw new AppError(`${key} cannot contain more than 20 values.`, 400);
    value.forEach((item, index) => validateQueryShape(item, `${key}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    throw new AppError(`${key} must be a scalar value.`, 400);
  }
  if (typeof value === 'string' && value.length > 500) {
    throw new AppError(`${key} cannot exceed 500 characters.`, 400);
  }
};

export const sanitizeRequestInputs = (req, res, next) => {
  try {
    if (req.body !== undefined) req.body = cleanValue(req.body);
    cleanValue(req.query);
    cleanValue(req.params);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateRequestShape = (req, res, next) => {
  try {
    if (
      req.body !== undefined &&
      (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
    ) {
      throw new AppError('Request body must be an object.', 400);
    }
    for (const [key, value] of Object.entries(req.query || {})) {
      validateQueryShape(value, key);
    }
    for (const [key, value] of Object.entries(req.params || {})) {
      if (/id$/i.test(key) && !mongoose.Types.ObjectId.isValid(value)) {
        throw new AppError(`${key} must be a valid ID.`, 400);
      }
      if (value.length > 200) throw new AppError(`${key} cannot exceed 200 characters.`, 400);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateObjectIdParam = (req, res, next, value, name) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(new AppError(`${name} must be a valid ID.`, 400));
  }
  next();
};
