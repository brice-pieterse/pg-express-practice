import rateLimit from 'express-rate-limit';

// new accounts rate limiter
export const signUpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000 * 4,
  max: 5, // 5 accounts per hour
  message:
    'Too many accounts created from this IP. Please try again after an hour'
});

// general purpose rate limiter
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP. Please try again after 15 minutes'
});
