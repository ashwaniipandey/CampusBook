import { rateLimit } from 'express-rate-limit';

const createLimiter = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        status: 'fail',
        message,
      }),
  });

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: 'Too many requests. Please try again later.',
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export const sensitiveAuthLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many login or password reset requests. Please try again later.',
});

export const chatLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: 'Too many messages sent. Please wait before sending more.',
});

export const uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: 'Too many uploads. Please wait before uploading again.',
});

export const broadcastLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  message: 'Too many broadcasts sent. Please wait before sending another announcement.',
});

export default apiLimiter;
