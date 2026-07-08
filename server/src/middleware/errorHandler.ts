import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, statusCode: err.statusCode },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { message: 'Internal server error', statusCode: 500 },
  });
}
