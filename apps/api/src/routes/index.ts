import { Router } from 'express';
import authRoutes from './auth.routes';
import hotelRoutes from './hotel.routes';
import roomRoutes from './room.routes';
import adminRoutes from './admin.routes';
import searchRoutes from './search.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import hotelAdminRoutes from './hotel-admin.routes';
import reviewRoutes from './review.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/hotels', hotelRoutes);
router.use('/hotels/:hotelId', roomRoutes);
router.use('/admin/hotels', adminRoutes);
router.use('/admin/reviews', adminRoutes);
router.use('/admin/users', adminRoutes);
router.use('/admin/dashboard', adminRoutes);
router.use('/search', searchRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/hotel-admin', hotelAdminRoutes);
router.use('/reviews', reviewRoutes);

export default router;