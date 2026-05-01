import type { Request, Response, NextFunction } from 'express';
import { register, login, refresh, logout, getMe, updateProfile } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';


const isProduction = process.env.NODE_ENV === 'production';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
  });
}

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await register(req.body);
    setRefreshCookie(res, result.tokens.refreshToken);
    sendSuccess(res, { accessToken: result.tokens.accessToken, user: result.user }, 201);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await login(req.body);
    setRefreshCookie(res, result.tokens.refreshToken);
    sendSuccess(res, { accessToken: result.tokens.accessToken, user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      throw new ApiError('Refresh token required', 401, 'UNAUTHORIZED');
    }

    const tokens = await refresh(token);
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, { accessToken: tokens.accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) {
      await logout(token);
    }
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    const user = await getMe(req.user.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    const user = await updateProfile(req.user.id, req.body);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
