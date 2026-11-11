import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export {};
