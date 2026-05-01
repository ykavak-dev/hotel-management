import type { Request, Response, NextFunction } from 'express';
import { createBooking, getUserBookings, getBookingById, cancelBooking } from '../services/booking.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';
import { createBookingSchema } from '@hotel/shared';

export async function createBookingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError('Invalid booking data', 400, 'VALIDATION_ERROR', parsed.error.flatten());
    }

    const { roomId, checkIn, checkOut, numberOfGuests, specialRequests } = parsed.data;

    const booking = await createBooking({
      userId: req.user.id,
      roomId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      numberOfGuests,
      specialRequests,
    });

    sendSuccess(res, booking, 201);
  } catch (err) {
    next(err);
  }
}

export async function getMyBookingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const bookings = await getUserBookings(req.user.id);
    sendSuccess(res, bookings);
  } catch (err) {
    next(err);
  }
}

export async function getBookingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const booking = await getBookingById(id, req.user.id);
    sendSuccess(res, booking);
  } catch (err) {
    next(err);
  }
}

export async function cancelBookingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { id } = req.params;
    const result = await cancelBooking(id, req.user.id);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
