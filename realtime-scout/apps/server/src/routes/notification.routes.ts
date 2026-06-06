import { Router } from 'express';
import { auth } from '../middleware/auth';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../controllers/notification.controller';

const router = Router();

router.get('/', auth, getNotifications as any);
router.get('/unread-count', auth, getUnreadCount as any);
router.post('/:id/read', auth, markAsRead as any);
router.post('/read-all', auth, markAllAsRead as any);

export default router;
