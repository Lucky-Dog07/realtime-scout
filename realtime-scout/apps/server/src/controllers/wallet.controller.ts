import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';

export async function getBalance(req: AuthRequest, res: Response) {
  const user = await db('users').select('balance', 'frozen_balance').where({ id: req.userId }).first();
  res.json({ code: 0, data: user, message: 'ok' });
}

export async function topup(req: AuthRequest, res: Response) {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ code: 40000, data: null, message: '金额必须大于0' });
  }

  await db.transaction(async (trx) => {
    await trx('users').where({ id: req.userId }).increment('balance', amount);
    const user = await trx('users').where({ id: req.userId }).first();
    await trx('transactions').insert({
      user_id: req.userId,
      type: 'topup',
      amount,
      balance_after: user.balance,
      description: '模拟充值',
    });
  });

  const user = await db('users').select('balance', 'frozen_balance').where({ id: req.userId }).first();
  res.json({ code: 0, data: user, message: 'ok' });
}

export async function getTransactions(req: AuthRequest, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const transactions = await db('transactions')
    .leftJoin('tasks', 'transactions.related_task_id', 'tasks.id')
    .where({ 'transactions.user_id': req.userId })
    .select('transactions.*', 'tasks.title as task_title')
    .orderBy('transactions.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  res.json({ code: 0, data: transactions, message: 'ok' });
}
