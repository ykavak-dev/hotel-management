import type { Request, Response, NextFunction } from 'express';
import { searchHotels, checkHotelAvailability } from '../services/search.service';
import { sendSuccess } from '../utils/response';
import { searchCache, generateCacheKey } from '../utils/cache';
import type { RoomType } from '../../generated/prisma';

function parseNumber(value: unknown, defaultValue: number): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

export async function searchHotelsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query;

    const params = {
      location: query.location ? String(query.location) : undefined,
      checkIn: String(query.checkIn || ''),
      checkOut: String(query.checkOut || ''),
      guests: parseNumber(query.guests, 1),
      minPrice: query.minPrice ? parseNumber(query.minPrice, 0) : undefined,
      maxPrice: query.maxPrice ? parseNumber(query.maxPrice, 0) : undefined,
      amenities: query.amenities ? String(query.amenities).split(',').filter(Boolean) : undefined,
      starRating: query.starRating ? parseNumber(query.starRating, 0) : undefined,
      roomType: query.roomType ? String(query.roomType).toUpperCase() as RoomType : undefined,
      sortBy: (query.sortBy as 'price_asc' | 'price_desc' | 'rating_desc' | 'relevance') ?? 'relevance',
      page: Math.max(1, parseNumber(query.page, 1)),
      limit: Math.min(100, Math.max(1, parseNumber(query.limit, 10))),
    };

    if (!params.checkIn || !params.checkOut) {
      res.status(400).json({
        success: false,
        error: { message: 'checkIn and checkOut are required', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const cacheKey = generateCacheKey('search', params);
    const cached = searchCache.get<ReturnType<typeof searchHotels>>(cacheKey);

    if (cached) {
      sendSuccess(res, await cached);
      return;
    }

    const result = await searchHotels(params);
    searchCache.set(cacheKey, result);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function checkAvailabilityHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hotelId, checkIn, checkOut, guests } = req.query;

    if (!hotelId || !checkIn || !checkOut) {
      res.status(400).json({
        success: false,
        error: { message: 'hotelId, checkIn, and checkOut are required', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const cacheKey = generateCacheKey('availability', {
      hotelId: String(hotelId),
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      guests: String(guests || '1'),
    });

    const cached = searchCache.get<ReturnType<typeof checkHotelAvailability>>(cacheKey);

    if (cached) {
      sendSuccess(res, await cached);
      return;
    }

    const result = await checkHotelAvailability(
      String(hotelId),
      String(checkIn),
      String(checkOut),
      parseNumber(guests, 1),
    );
    searchCache.set(cacheKey, result);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
