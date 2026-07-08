import jwt, { JwtPayload } from 'jsonwebtoken';

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET is not set in environment variables');
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET is not set in environment variables');
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export function generateAccessToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): string | JwtPayload {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): string | JwtPayload {
  return jwt.verify(token, REFRESH_SECRET);
}
