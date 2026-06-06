import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createTask,
  getNearbyTasks,
  getTaskById,
  acceptTask,
  cancelTask,
  confirmTask,
  rejectTask,
  giveUpTask,
  getMyPublished,
  getMyAccepted,
  submitTask,
} from '../controllers/task.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/', auth, createTask);
router.get('/nearby', getNearbyTasks);
router.get('/my/published', auth, getMyPublished);
router.get('/my/accepted', auth, getMyAccepted);
router.get('/:id', getTaskById);
router.post('/:id/accept', auth, acceptTask);
router.post('/:id/cancel', auth, cancelTask);
router.post('/:id/giveup', auth, giveUpTask);
router.post('/:id/confirm', auth, confirmTask);
router.post('/:id/reject', auth, rejectTask);
router.post('/:id/submit', auth, upload.array('photos', 9), submitTask);

export default router;
