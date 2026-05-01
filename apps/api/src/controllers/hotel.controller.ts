import type { Request, Response, NextFunction } from 'express';
import {
  listVerifiedHotels,
  getHotelDetail,
  createHotel,
  updateHotel,
  getMyHotels,
} from '../services/hotel.service';
import { sendSuccess } from '../utils/response';
import { ApiError } from '../utils/ApiError';

export async function listHotelsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const result = await listVerifiedHotels(page, limit);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getHotelDetailHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const hotel = await getHotelDetail(id);
    sendSuccess(res, hotel);
  } catch (err) {
    next(err);
  }
}

export async function createHotelHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    const hotel = await createHotel({
      ...req.body,
      ownerId: req.user.id,
    });
    sendSuccess(res, hotel, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateHotelHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const hotel = await updateHotel(id, req.body);
    sendSuccess(res, hotel);
  } catch (err) {
    next(err);
  }
}

export async function myHotelsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    const hotels = await getMyHotels(req.user.id);
    sendSuccess(res, hotels);
  } catch (err) {
    next(err);
  }
}
