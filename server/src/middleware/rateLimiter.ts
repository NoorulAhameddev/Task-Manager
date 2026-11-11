import { rateLimit } from 'express-rate-limit';

const DEFAULT_LIMIT = 100;

export function createAuthLimiter(limit = Number(process.env.RATE_LIMIT_MAX) || DEFAULT_LIMIT) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: { message: 'Too many requests, please try again later', statusCode: 429 },
    },
  });
}

export const authLimiter = createAuthLimiter();
