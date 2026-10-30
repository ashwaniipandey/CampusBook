/**
 * Custom Operational Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
};

/**
 * Global Central Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400);
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    const message = `Duplicate value '${value}' for field '${field}'. Please use another value.`;
    error = new AppError(message, 409);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((el) => el.message);
    const message = `Validation error: ${errors.join('. ')}`;
    error = new AppError(message, 400);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your authentication token has expired. Please log in again.', 401);
  }

  const isDev = process.env.NODE_ENV !== 'production';

  res.status(error.statusCode || 500).json({
    status: error.status || 'error',
    message: error.message || 'Internal Server Error',
    ...(isDev && {
      error: err,
      stack: err.stack,
    }),
  });
};

export default errorHandler;

