import { Router } from 'express';
import { auth } from '../middleware/auth';
import { suggestPrice } from '../controllers/ai.controller';

const router = Router();

router.post('/suggest-price', auth, suggestPrice);

export default router;
