import { prisma } from '../utils/db';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '../../generated/prisma';

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  _count: { bookings: number };
}

async function logAdminAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
): Promise<void> {
  await prisma.adminActivityLog.create({
    data: { adminId, action, entityType, entityId, details: details as any },
  });
}

export async function listUsers(
  page: number = 1,
  limit: number = 10,
  role?: UserRole,
  search?: string
): Promise<{ users: UserListItem[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  adminId: string
): Promise<UserListItem> {
  if (userId === adminId) {
    throw new ApiError('Cannot change your own role', 403, 'CANNOT_CHANGE_OWN_ROLE');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  await logAdminAction(adminId, 'USER_ROLE_CHANGED', 'User', userId, {
    newRole,
  });

  return user;
}

export async function banUser(userId: string, adminId: string): Promise<UserListItem> {
  if (userId === adminId) {
    throw new ApiError('Cannot ban yourself', 403, 'CANNOT_BAN_SELF');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  await logAdminAction(adminId, 'USER_BANNED', 'User', userId, {
    bannedEmail: user.email,
  });

  return user;
}

export async function getUserActivity(userId: string): Promise<{
  bookings: Array<{
    id: string;
    checkIn: Date;
    checkOut: Date;
    status: string;
    totalPrice: number;
    hotelName: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    isApproved: boolean;
    hotelName: string;
    createdAt: Date;
  }>;
  totalBookings: number;
  totalReviews: number;
}> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError('User not found', 404, 'NOT_FOUND');

  const [bookings, reviews, bookingCount, reviewCount] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { room: { include: { hotel: { select: { name: true } } } } },
    }),
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { hotel: { select: { name: true } } },
    }),
    prisma.booking.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
  ]);

  return {
    bookings: bookings.map((b) => ({
      id: b.id,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      status: b.status,
      totalPrice: Number(b.totalPrice),
      hotelName: b.room.hotel.name,
    })),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isApproved: r.isApproved,
      hotelName: r.hotel.name,
      createdAt: r.createdAt,
    })),
    totalBookings: bookingCount,
    totalReviews: reviewCount,
  };
}
