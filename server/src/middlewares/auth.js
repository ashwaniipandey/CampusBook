import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware to protect routes and authenticate users
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Get token from cookies or Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401)
      );
    }

    // 2. Verify token
    const jwtSecret = process.env.JWT_SECRET || 'campusbook_jwt_secret_dev_key_2026_xyz';
    const decoded = jwt.verify(token, jwtSecret);

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id).populate('university');
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // 4. Check if account is suspended
    if (currentUser.status === 'suspended') {
      return next(
        new AppError('Your account has been suspended. Please contact support.', 403)
      );
    }

    // 5. Grant access: attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles (e.g. 'admin')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('Forbidden: You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

/**
 * Optional middleware to enforce verified student status
 */
export const requireVerified = (req, res, next) => {
  if (!req.user || (!req.user.isVerified && req.user.role !== 'admin')) {
    return next(
      new AppError(
        'Please verify your university email before continuing.',
        403
      )
    );
  }
  next();
};

/**
 * Middleware to optionally authenticate users (if token present)
 * Allows unauthenticated requests to continue without throwing 401
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET || 'campusbook_jwt_secret_dev_key_2026_xyz';
    const decoded = jwt.verify(token, jwtSecret);

    const currentUser = await User.findById(decoded.id).populate('university');
    if (currentUser && currentUser.status !== 'suspended') {
      req.user = currentUser;
    }
    next();
  } catch (error) {
    // If token verification fails, simply continue unauthenticated
    next();
  }
};

export default { protect, authorize, requireVerified, optionalAuth };

