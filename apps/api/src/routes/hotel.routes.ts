import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/jwt.middleware';
import { requireRole } from '../middleware/role.middleware';
import { requireOwnership } from '../middleware/ownership';
import {
  listHotelsHandler,
  getHotelDetailHandler,
  createHotelHandler,
  updateHotelHandler,
  myHotelsHandler,
} from '../controllers/hotel.controller';
import { getHotelReviewsHandler } from '../controllers/review.controller';
import { createHotelSchema, updateHotelSchema } from '@hotel/shared';
import { UserRole } from '../../generated/prisma';

const router = Router();

// Public
router.get('/', listHotelsHandler);
router.get('/:id', getHotelDetailHandler);
router.get('/:hotelId/reviews', getHotelReviewsHandler);

// Hotel Admin
router.get('/my-hotels', requireAuth, requireRole(UserRole.HOTEL_ADMIN), myHotelsHandler);
router.post('/', requireAuth, requireRole(UserRole.HOTEL_ADMIN), validate(createHotelSchema), createHotelHandler);
router.put('/:id', requireAuth, requireRole(UserRole.HOTEL_ADMIN), requireOwnership, validate(updateHotelSchema), updateHotelHandler);

export default router;
