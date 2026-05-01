import type { Request, Response, NextFunction } from 'express';
import { processPayment, refundPayment, getPaymentsByBooking } from '../services/payment.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';

export async function processPaymentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { bookingId, paymentMethod, cardToken, idempotencyKey } = req.body;

    if (!bookingId || !paymentMethod || !cardToken) {
      throw new ApiError('bookingId, paymentMethod, and cardToken are required', 400, 'VALIDATION_ERROR');
    }

    const payment = await processPayment({
      bookingId,
      paymentMethod,
      cardToken,
      idempotencyKey,
    });

    sendSuccess(res, payment, 201);
  } catch (err) {
    next(err);
  }
}

export async function refundPaymentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Only SYSTEM_ADMIN or HOTEL_ADMIN can refund
    if (req.user.role !== 'SYSTEM_ADMIN' && req.user.role !== 'HOTEL_ADMIN') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    const { id } = req.params;
    const payment = await refundPayment(id, req.user.id);
    sendSuccess(res, payment);
  } catch (err) {
    next(err);
  }
}

export async function getBookingPaymentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { bookingId } = req.params;
    const payments = await getPaymentsByBooking(bookingId);
    sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
}
