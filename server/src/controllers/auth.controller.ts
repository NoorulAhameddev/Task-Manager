import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, findUserById } from '../services/auth.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

function userIdFromPayload(req: Request): string | undefined {
  const payload = req.user;
  if (typeof payload === 'string') return payload;
  return payload?.id;
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    const user = await registerUser(name, email, password);

    const accessToken = generateAccessToken({ id: user.id });
    const refreshToken = generateRefreshToken({ id: user.id });

    setRefreshCookie(res, refreshToken);

    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);

    const accessToken = generateAccessToken({ id: user.id });
    const refreshToken = generateRefreshToken({ id: user.id });

    setRefreshCookie(res, refreshToken);

    res.status(200).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, _next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({
        error: { message: 'Refresh token not found', statusCode: 401 },
      });
      return;
    }

    const decoded = verifyRefreshToken(token);
    const payload = typeof decoded === 'string' ? { id: decoded } : decoded;

    if (!payload.id) {
      throw new Error('Refresh token payload missing user id');
    }

    await findUserById(payload.id);

    const accessToken = generateAccessToken({ id: payload.id });

    res.status(200).json({ accessToken });
  } catch {
    clearRefreshCookie(res);
    res.status(401).json({
      error: { message: 'Invalid or expired refresh token', statusCode: 401 },
    });
  }
}

export async function logout(_req: Request, res: Response) {
  clearRefreshCookie(res);
  res.status(200).json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = userIdFromPayload(req);
    if (!userId) {
      res.status(401).json({ error: { message: 'Unauthorized', statusCode: 401 } });
      return;
    }
    const user = await findUserById(userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
