import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';

export async function getNotifications(req: AuthRequest, res: Response) {
  const notifications = await db('notifications')
    .where({ user_id: req.userId })
    .orderBy('created_at', 'desc')
    .limit(50);

  res.json({ code: 0, data: notifications });
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  const [result] = await db('notifications')
    .where({ user_id: req.userId, is_read: false })
    .count('id as count');

  res.json({ code: 0, data: { count: Number(result.count) } });
}

export async function markAsRead(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await db('notifications')
    .where({ id, user_id: req.userId })
    .update({ is_read: true });

  res.json({ code: 0, data: null, message: 'ok' });
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  await db('notifications')
    .where({ user_id: req.userId, is_read: false })
    .update({ is_read: true });

  res.json({ code: 0, data: null, message: 'ok' });
}
