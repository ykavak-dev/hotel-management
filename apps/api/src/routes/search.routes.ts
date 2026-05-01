import { Router } from 'express';
import { searchHotelsHandler, checkAvailabilityHandler } from '../controllers/search.controller';

const router = Router();

router.get('/hotels', searchHotelsHandler);
router.get('/availability', checkAvailabilityHandler);

export default router;
