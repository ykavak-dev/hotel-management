import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/jwt.middleware';
import { requireRole } from '../middleware/role.middleware';
import { requireOwnership } from '../middleware/ownership';
import {
  getRoomDetailHandler,
  createRoomHandler,
  updateRoomHandler,
  deleteRoomHandler,
} from '../controllers/room.controller';
import { createRoomSchema, updateRoomSchema } from '@hotel/shared';
import { UserRole } from '../../generated/prisma';

const router = Router({ mergeParams: true });

// Public
router.get('/:roomId', getRoomDetailHandler);

// Hotel Admin
router.post('/rooms', requireAuth, requireRole(UserRole.HOTEL_ADMIN), requireOwnership, validate(createRoomSchema), createRoomHandler);
router.put('/rooms/:roomId', requireAuth, requireRole(UserRole.HOTEL_ADMIN), requireOwnership, validate(updateRoomSchema), updateRoomHandler);
router.delete('/rooms/:roomId', requireAuth, requireRole(UserRole.HOTEL_ADMIN), requireOwnership, deleteRoomHandler);

export default router;
