import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth';

export async function register(req: AuthRequest, res: Response) {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 40000, data: null, message: '用户名和密码必填' });
  }

  const existing = await db('users').where({ username }).first();
  if (existing) {
    return res.status(400).json({ code: 40001, data: null, message: '用户名已存在' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [user] = await db('users')
    .insert({ username, password_hash, nickname: nickname || username })
    .returning('*');

  const token = jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: '7d' as any });
  const { password_hash: _, ...userData } = user;
  res.json({ code: 0, data: { token, user: userData }, message: 'ok' });
}

export async function login(req: AuthRequest, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 40000, data: null, message: '用户名和密码必填' });
  }

  const user = await db('users').where({ username }).first();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ code: 40100, data: null, message: '用户名或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: '7d' as any });
  const { password_hash: _, ...userData } = user;
  res.json({ code: 0, data: { token, user: userData }, message: 'ok' });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await db('users').where({ id: req.userId }).first();
  if (!user) {
    return res.status(404).json({ code: 40400, data: null, message: '用户不存在' });
  }
  const { password_hash: _, ...userData } = user;
  res.json({ code: 0, data: userData, message: 'ok' });
}
