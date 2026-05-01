import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/jwt.middleware';
import { requireRole } from '../middleware/role.middleware';
import { verifyHotelHandler, rejectHotelHandler } from '../controllers/admin.controller';
import { rejectHotelSchema } from '@hotel/shared';
import { UserRole } from '../../generated/prisma';
import {
  approveReviewHandler,
  rejectReviewHandler,
  deleteReviewHandler,
} from '../controllers/review.controller';
import {
  listUsersHandler,
  updateUserRoleHandler,
  banUserHandler,
  getUserActivityHandler,
} from '../controllers/adminUser.controller';
import { getDashboardHandler } from '../controllers/dashboard.controller';

const router = Router({ mergeParams: true });

// Hotel verification
router.put('/hotels/:id/verify', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), verifyHotelHandler);
router.put('/hotels/:id/reject', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), validate(rejectHotelSchema), rejectHotelHandler);

// Review moderation
router.put('/reviews/:id/approve', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), approveReviewHandler);
router.put('/reviews/:id/reject', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), rejectReviewHandler);
router.delete('/reviews/:id', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), deleteReviewHandler);

// User management
router.get('/users', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), listUsersHandler);
router.put('/users/:id/role', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), updateUserRoleHandler);
router.put('/users/:id/ban', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), banUserHandler);
router.get('/users/:id/activity', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), getUserActivityHandler);

// Dashboard
router.get('/dashboard', requireAuth, requireRole(UserRole.SYSTEM_ADMIN), getDashboardHandler);

export default router;