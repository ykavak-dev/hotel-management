import { prisma } from '../utils/db';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '../../generated/prisma';

export interface CreateReviewData {
  userId: string;
  hotelId: string;
  bookingId: string;
  rating: number;
  comment: string;
}

export interface ReviewDetail {
  id: string;
  userId: string;
  hotelId: string;
  bookingId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  user?: { firstName: string; lastName: string };
  hotel?: { id: string; name: string };
}

async function recalculateHotelRating(
  hotelId: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<number | null> {
  const aggregate = await tx.review.aggregate({
    where: { hotelId, isApproved: true },
    _avg: { rating: true },
  });
  const newAvg = aggregate._avg.rating
    ? Number(aggregate._avg.rating.toFixed(2))
    : null;
  await tx.hotel.update({
    where: { id: hotelId },
    data: { averageRating: newAvg } as any,
  });
  return newAvg;
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

export async function createReview(data: CreateReviewData, userRole: UserRole): Promise<ReviewDetail> {
  const { userId, hotelId, bookingId, rating, comment } = data;

  // Validate user has a COMPLETED booking at this hotel
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
      status: 'COMPLETED',
      room: { hotelId },
    },
  });

  if (!booking) {
    throw new ApiError(
      'You must have a completed booking at this hotel to leave a review',
      400,
      'INVALID_BOOKING'
    );
  }

  // Check booking not already reviewed
  const existingReview = await prisma.review.findUnique({
    where: { bookingId },
  });

  if (existingReview) {
    throw new ApiError('This booking has already been reviewed', 400, 'ALREADY_REVIEWED');
  }

  const isApproved = userRole === 'SYSTEM_ADMIN';

  const review = await prisma.review.create({
    data: { userId, hotelId, bookingId, rating, comment, isApproved },
    include: {
      user: { select: { firstName: true, lastName: true } },
      hotel: { select: { id: true, name: true } },
    },
  });

  return review as ReviewDetail;
}

export async function getHotelReviews(
  hotelId: string,
  approvedOnly: boolean = true,
  page: number = 1,
  limit: number = 10
): Promise<{ reviews: ReviewDetail[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit;
  const where = { hotelId, ...(approvedOnly ? { isApproved: true } : {}) };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews: reviews as ReviewDetail[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserReviews(userId: string): Promise<ReviewDetail[]> {
  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      hotel: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return reviews as ReviewDetail[];
}

export async function approveReview(reviewId: string, adminId: string): Promise<ReviewDetail> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError('Review not found', 404, 'NOT_FOUND');

  const updated = await prisma.$transaction(async (tx) => {
    const approved = await tx.review.update({
      where: { id: reviewId },
      data: { isApproved: true },
      include: {
        user: { select: { firstName: true, lastName: true } },
        hotel: { select: { id: true, name: true } },
      },
    });
    await recalculateHotelRating(review.hotelId, tx);
    return approved;
  });

  await logAdminAction(adminId, 'REVIEW_APPROVED', 'Review', reviewId, {
    rating: updated.rating,
    hotelId: updated.hotelId,
  });

  return updated as ReviewDetail;
}

export async function rejectReview(reviewId: string, adminId: string): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError('Review not found', 404, 'NOT_FOUND');

  await prisma.review.delete({ where: { id: reviewId } });

  await logAdminAction(adminId, 'REVIEW_REJECTED', 'Review', reviewId, {
    rating: review.rating,
    hotelId: review.hotelId,
  });
}

export async function deleteReview(reviewId: string, adminId: string): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError('Review not found', 404, 'NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });
    await recalculateHotelRating(review.hotelId, tx);
  });

  await logAdminAction(adminId, 'REVIEW_DELETED', 'Review', reviewId, {
    rating: review.rating,
    hotelId: review.hotelId,
  });
}
