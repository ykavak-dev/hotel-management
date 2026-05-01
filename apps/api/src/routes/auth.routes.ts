import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/jwt.middleware';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  updateProfileHandler,
} from '../controllers/auth.controller';
import { registerSchema, loginSchema, updateProfileSchema } from '@hotel/shared';

const router = Router();

router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', requireAuth, meHandler);
router.put('/profile', requireAuth, validate(updateProfileSchema), updateProfileHandler);

export default router;
