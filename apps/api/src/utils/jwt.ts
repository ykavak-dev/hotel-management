import jwt from 'jsonwebtoken';
import { ApiError } from './ApiError';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'fallback-refresh-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' } as AccessTokenPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' } as RefreshTokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    if (decoded.type !== 'access') {
      throw new ApiError('Invalid token type', 401, 'UNAUTHORIZED');
    }
    return decoded;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Invalid or expired access token', 401, 'UNAUTHORIZED');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      throw new ApiError('Invalid token type', 401, 'UNAUTHORIZED');
    }
    return decoded;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }
}
