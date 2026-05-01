import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { UserRole, HotelOwnerRole } from '../../generated/prisma';
import { prisma } from '../utils/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import type { AccessTokenPayload } from '../utils/jwt';

const SALT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

function sanitizeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
  };
}

function createTokens(user: AuthUser, tokenId: string): AuthTokens {
  const accessPayload: Omit<AccessTokenPayload, 'type'> = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken({ userId: user.id, tokenId });

  return { accessToken, refreshToken };
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  hotelName?: string;
  hotelAddress?: string;
  hotelCity?: string;
  hotelCountry?: string;
}): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ApiError('Email already registered', 409, 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const role = data.role ?? UserRole.CUSTOMER;

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      role,
    },
  });

  // If HOTEL_ADMIN, create a pending hotel and hotel owner record
  if (role === UserRole.HOTEL_ADMIN && data.hotelName && data.hotelAddress && data.hotelCity && data.hotelCountry) {
    const hotel = await prisma.hotel.create({
      data: {
        name: data.hotelName,
        address: data.hotelAddress,
        city: data.hotelCity,
        country: data.hotelCountry,
        ownerId: user.id,
        isVerified: false,
      },
    });

    await prisma.hotelOwner.create({
      data: {
        userId: user.id,
        hotelId: hotel.id,
        role: HotelOwnerRole.OWNER,
      },
    });
  }

  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      token: randomUUID(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const authUser = sanitizeUser(user);
  const tokens = createTokens(authUser, refreshTokenRecord.token);

  // Store the actual JWT refresh token hash or identifier
  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { token: tokens.refreshToken },
  });

  return { user: authUser, tokens };
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new ApiError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const authUser = sanitizeUser(user);

  // Invalidate old refresh tokens for this user (optional: keep multiple or rotate)
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  const refreshTokenRecord = await prisma.refreshToken.create({
    data: {
      token: randomUUID(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const tokens = createTokens(authUser, refreshTokenRecord.token);

  await prisma.refreshToken.update({
    where: { id: refreshTokenRecord.id },
    data: { token: tokens.refreshToken },
  });

  return { user: authUser, tokens };
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const decoded = verifyRefreshToken(refreshToken);

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      userId: decoded.userId,
      token: refreshToken,
      expiresAt: { gt: new Date() },
    },
  });

  if (!storedToken) {
    throw new ApiError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    throw new ApiError('User not found or inactive', 401, 'UNAUTHORIZED');
  }

  // Rotate: delete old token, create new one
  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  const authUser = sanitizeUser(user);
  const newRefreshTokenRecord = await prisma.refreshToken.create({
    data: {
      token: randomUUID(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const tokens = createTokens(authUser, newRefreshTokenRecord.token);

  await prisma.refreshToken.update({
    where: { id: newRefreshTokenRecord.id },
    data: { token: tokens.refreshToken },
  });

  return tokens;
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.deleteMany({
      where: {
        userId: decoded.userId,
        token: refreshToken,
      },
    });
  } catch {
    // Silently fail if token is invalid — user is already "logged out"
  }
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError('User not found', 404, 'NOT_FOUND');
  }

  return sanitizeUser(user);
}

export async function updateProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  },
): Promise<AuthUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
    },
  });

  return sanitizeUser(user);
}
