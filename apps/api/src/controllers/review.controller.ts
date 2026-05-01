import type { Request, Response, NextFunction } from 'express';
import { createReview, getHotelReviews, getUserReviews, approveReview, rejectReview, deleteReview } from '../services/review.service';
import { sendSuccess } from '../utils/response';

export async function createReviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hotelId, bookingId, rating, comment } = req.body;
    const review = await createReview(
      { userId: req.user!.id, hotelId, bookingId, rating, comment },
      req.user!.role as 'CUSTOMER' | 'HOTEL_ADMIN' | 'SYSTEM_ADMIN'
    );
    sendSuccess(res, review, 201);
  } catch (err) {
    next(err);
  }
}

export async function getHotelReviewsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hotelId } = req.params;
    const approvedOnly = req.query.approvedOnly !== 'false';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const result = await getHotelReviews(hotelId, approvedOnly, page, limit);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getMyReviewsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const reviews = await getUserReviews(userId);
    sendSuccess(res, reviews);
  } catch (err) {
    next(err);
  }
}

export async function approveReviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const review = await approveReview(id, req.user!.id);
    sendSuccess(res, review);
  } catch (err) {
    next(err);
  }
}

export async function rejectReviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await rejectReview(id, req.user!.id);
    sendSuccess(res, { message: 'Review rejected and deleted' });
  } catch (err) {
    next(err);
  }
}

export async function deleteReviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await deleteReview(id, req.user!.id);
    sendSuccess(res, { message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
}