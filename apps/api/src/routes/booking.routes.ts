import { Router } from 'express';
import { requireAuth } from '../middleware/jwt.middleware';
import {
  createBookingHandler,
  getMyBookingsHandler,
  getBookingHandler,
  cancelBookingHandler,
} from '../controllers/booking.controller';

const router = Router();

// All booking routes require authentication
router.use(requireAuth);

router.post('/', createBookingHandler);
router.get('/', getMyBookingsHandler);
router.get('/:id', getBookingHandler);
router.put('/:id/cancel', cancelBookingHandler);

export default router;
