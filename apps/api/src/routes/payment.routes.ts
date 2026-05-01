import { Router } from 'express';
import { requireAuth } from '../middleware/jwt.middleware';
import {
  processPaymentHandler,
  refundPaymentHandler,
  getBookingPaymentsHandler,
} from '../controllers/payment.controller';

const router = Router();

router.use(requireAuth);

router.post('/process', processPaymentHandler);
router.get('/booking/:bookingId', getBookingPaymentsHandler);
router.put('/:id/refund', refundPaymentHandler);

export default router;
