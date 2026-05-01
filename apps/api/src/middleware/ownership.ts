import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';


export async function requireOwnership(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      });
      return;
    }

    const hotelId = req.params.id ?? req.params.hotelId;
    if (!hotelId) {
      res.status(400).json({
        success: false,
        error: { message: 'Hotel ID is required', code: 'BAD_REQUEST' },
      });
      return;
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { ownerId: true },
    });

    if (!hotel) {
      res.status(404).json({
        success: false,
        error: { message: 'Hotel not found', code: 'NOT_FOUND' },
      });
      return;
    }

    if (hotel.ownerId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: { message: 'You do not own this hotel', code: 'FORBIDDEN' },
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
