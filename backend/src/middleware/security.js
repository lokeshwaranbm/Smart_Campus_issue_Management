import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
});

export const sanitizeNoSqlMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }) => {
    // Keep minimal signal while avoiding noisy output.
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`Sanitized suspicious key: ${key}`);
    }
  },
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_GLOBAL_MAX || 600),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests. Please try again later.' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});
