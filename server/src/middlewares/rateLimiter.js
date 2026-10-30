/**
 * Memory-based Rate Limiter Middleware for Auth Routes
 * Prevents brute force and denial of service attacks without requiring external store.
 */
export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // default 15 minutes
  const max = options.max || 10; // default 10 requests per window
  const message =
    options.message || 'Too many attempts from this IP, please try again later.';

  const ipHits = new Map();

  // Periodic cleanup of expired records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipHits.entries()) {
      if (now > data.resetTime) {
        ipHits.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref(); // unref so it does not keep process alive

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let clientData = ipHits.get(ip);

    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipHits.set(ip, clientData);
    } else {
      clientData.count += 1;
    }

    const remaining = Math.max(0, max - clientData.count);
    const retryAfterSeconds = Math.ceil((clientData.resetTime - now) / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', new Date(clientData.resetTime).toISOString());

    if (clientData.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        status: 'fail',
        message,
        retryAfter: `${retryAfterSeconds}s`,
      });
    }

    next();
  };
};

// Standard rate limiters
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export const sensitiveAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login or password reset requests. Please try again later.',
});

export default authLimiter;

