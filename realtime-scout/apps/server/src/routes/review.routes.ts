import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createReview,
  getTaskReviews,
  getUserReviews,
  getGivenReviews,
} from '../controllers/review.controller';

const router = Router();

router.get('/given', auth, getGivenReviews);
router.get('/users/:userId', getUserReviews);
router.get('/tasks/:id', getTaskReviews);
router.post('/tasks/:id', auth, createReview);

export default router;
