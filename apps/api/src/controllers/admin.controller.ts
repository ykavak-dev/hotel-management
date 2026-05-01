import type { Request, Response, NextFunction } from 'express';
import { verifyHotel, rejectHotel } from '../services/hotel.service';
import { sendSuccess } from '../utils/response';

export async function verifyHotelHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const hotel = await verifyHotel(id);
    sendSuccess(res, hotel);
  } catch (err) {
    next(err);
  }
}

export async function rejectHotelHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const hotel = await rejectHotel(id, reason);
    sendSuccess(res, hotel);
  } catch (err) {
    next(err);
  }
}
