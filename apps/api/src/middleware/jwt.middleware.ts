import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Access token required', 'UNAUTHORIZED', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    logger.warn('JWT verification failed', err);
    if (err instanceof ApiError) {
      sendError(res, err.message, err.code, err.statusCode);
      return;
    }
    sendError(res, 'Invalid or expired token', 'UNAUTHORIZED', 401);
  }
}

function sendError(res: Response, message: string, code: string, statusCode: number): void {
  res.status(statusCode).json({
    success: false,
    error: { message, code },
  });
}
