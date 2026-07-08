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

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({
        error: { message: 'Refresh token not found', statusCode: 401 },
      });
      return;
    }

    const decoded = verifyRefreshToken(token);
    const payload = typeof decoded === 'string' ? { sub: decoded } : decoded;

    const accessToken = generateAccessToken({ id: payload.id });

    res.status(200).json({ accessToken });
  } catch {
    res.status(401).json({
      error: { message: 'Invalid or expired refresh token', statusCode: 401 },
    });
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.user;
    const userId = typeof payload === 'string' ? payload : payload?.id;
    const user = await findUserById(userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
