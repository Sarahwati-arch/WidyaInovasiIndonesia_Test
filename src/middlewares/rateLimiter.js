const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

/**
 * Custom handler when rate limit is exceeded.
 */
const authRateLimitHandler = (req, res, next) => {
  next(new AppError(429, 'TOO_MANY_REQUESTS', 'Too many requests, please try again later'));
};

/**
 * Rate limiter for authentication routes to mitigate brute-force attacks.
 * Skips enforcement during automated test runs.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: authRateLimitHandler,
});

module.exports = {
  authRateLimiter,
  authRateLimitHandler,
};
