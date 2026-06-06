import { Router } from 'express';
import { auth } from '../middleware/auth';
import { chatUpload } from '../middleware/upload';
import { getMessages, sendMessage } from '../controllers/chat.controller';

const router = Router();

router.get('/:taskId/messages', auth, getMessages as any);
router.post('/:taskId/messages', auth, chatUpload.single('file'), sendMessage as any);

export default router;
