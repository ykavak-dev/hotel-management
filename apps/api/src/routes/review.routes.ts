import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/jwt.middleware';
import { createReviewSchema } from '@hotel/shared';
import {
  createReviewHandler,
  getMyReviewsHandler,
} from '../controllers/review.controller';

const router = Router();

router.post('/', requireAuth, validate(createReviewSchema), createReviewHandler);
router.get('/my-reviews', requireAuth, getMyReviewsHandler);

export default router;