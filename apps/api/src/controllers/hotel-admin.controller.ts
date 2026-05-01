import type { Request, Response, NextFunction } from 'express';
import { getHotelAdminBookings, confirmBooking, checkInBooking, checkOutBooking } from '../services/booking.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';

export async function getHotelAdminBookingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORITY');
    }

    if (req.user.role !== 'HOTEL_ADMIN' && req.user.role !== 'SYSTEM_ADMIN') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 10)));

    const result = await getHotelAdminBookings(req.user.id, page, limit);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function confirmBookingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const booking = await confirmBooking(id, req.user.id);
    sendSuccess(res, booking);
  } catch (err) {
    next(err);
  }
}

export async function checkInBookingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const booking = await checkInBooking(id, req.user.id);
    sendSuccess(res, booking);
  } catch (err) {
    next(err);
  }
}

export async function checkOutBookingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const booking = await checkOutBooking(id, req.user.id);
    sendSuccess(res, booking);
  } catch (err) {
    next(err);
  }
}
