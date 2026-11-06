/**
 * Custom Operational Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    if (errorCode) this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError('The requested route was not found.', 404));
};

/**
 * Global Central Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const candidateStatusCode = Number(err.statusCode ?? err.status);
  const statusCode = Number.isInteger(candidateStatusCode) &&
    candidateStatusCode >= 400 && candidateStatusCode <= 599
    ? candidateStatusCode
    : 500;
  let error = {
    message: err.message,
    name: err.name,
    statusCode,
    status: statusCode < 500 ? 'fail' : 'error',
  };

  if (err.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}.`, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`A record with this ${field} already exists.`, 409);
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((el) => el.message);
    error = new AppError(`Validation error: ${errors.join('. ')}`, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your authentication token has expired. Please log in again.', 401);
  }

  if (err.type === 'entity.too.large') {
    error = new AppError('Request body exceeds the 1 MB limit.', 413);
  } else if (err instanceof SyntaxError && 'body' in err) {
    error = new AppError('Request body contains invalid JSON.', 400);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const responseStatusCode = error.statusCode;

  // For unhandled internal server errors, mask the message in production
  const message =
    isProduction && responseStatusCode >= 500 && !err.isOperational
      ? 'An unexpected error occurred.'
      : error.message || 'Internal Server Error';

  // Always log 5xx errors or unexpected errors to server logs
  if (responseStatusCode >= 500 || !err.isOperational) {
    console.error(`❌ [Server Error] ${req.method} ${req.originalUrl || req.path}:`, err);
  } else if (!isProduction && process.env.NODE_ENV !== 'test') {
    console.warn(`⚠️ [Client Error] ${req.method} ${req.originalUrl || req.path}: ${err.message}`);
  }

  res.status(responseStatusCode).json({
    status: error.status || 'error',
    message,
    ...(err.errorCode ? { code: err.errorCode } : {}),
    ...(!isProduction && {
      error: error.name,
      stack: err.stack,
    }),
  });
};

export default errorHandler;
