import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await db('users').where({ id: req.userId }).first();
  if (!user) {
    return res.status(404).json({ code: 40400, data: null, message: '用户不存在' });
  }
  const { password_hash: _, ...userData } = user;
  res.json({ code: 0, data: userData, message: 'ok' });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const { nickname, avatar_url, phone } = req.body;
  const updates: any = {};
  if (nickname !== undefined) updates.nickname = nickname;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (phone !== undefined) updates.phone = phone;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ code: 40000, data: null, message: '没有要更新的字段' });
  }

  updates.updated_at = new Date();
  await db('users').where({ id: req.userId }).update(updates);
  const user = await db('users').where({ id: req.userId }).first();
  const { password_hash: _, ...userData } = user;
  res.json({ code: 0, data: userData, message: 'ok' });
}

export async function uploadAvatar(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ code: 40000, data: null, message: '请上传头像文件' });
  }

  const avatar_url = `/uploads/${file.filename}`;
  await db('users').where({ id: req.userId }).update({ avatar_url, updated_at: new Date() });
  const user = await db('users').where({ id: req.userId }).first();
  const { password_hash: _, ...userData } = user;
  res.json({ code: 0, data: userData, message: 'ok' });
}
