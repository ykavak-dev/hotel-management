import { Router } from 'express';
import { requireAuth } from '../middleware/jwt.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  getHotelAdminBookingsHandler,
  confirmBookingHandler,
  checkInBookingHandler,
  checkOutBookingHandler,
} from '../controllers/hotel-admin.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole('HOTEL_ADMIN', 'SYSTEM_ADMIN'));

router.get('/bookings', getHotelAdminBookingsHandler);
router.put('/bookings/:id/confirm', confirmBookingHandler);
router.put('/bookings/:id/check-in', checkInBookingHandler);
router.put('/bookings/:id/check-out', checkOutBookingHandler);

export default router;
