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
  const responseStatusCode = error.statusCode >= 500 ? 500 : error.statusCode;
  const message = isProduction && responseStatusCode === 500
    ? 'An unexpected error occurred.'
    : error.message || 'Internal Server Error';

  if (!isProduction) {
    console.error(`${req.method} ${req.path}: ${err.name || 'Error'}`);
  }

  res.status(responseStatusCode).json({
    status: error.status || 'error',
    message,
    ...(!isProduction && {
      error: error.name,
      stack: err.stack,
    }),
  });
};

export default errorHandler;
