import { Response } from 'express';
import { Knex } from 'knex';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { emitToUser } from '../socket';
import { RATING_BASELINE, RATING_PRIOR_COUNT } from '@realtime-scout/shared';

async function recomputeUserRating(trx: Knex.Transaction, userId: number) {
  const agg = await trx('reviews')
    .where({ reviewee_id: userId })
    .select(trx.raw('COUNT(*)::int as count'), trx.raw('COALESCE(SUM(overall), 0) as sum'))
    .first();

  const count = Number(agg?.count || 0);
  const sum = Number(agg?.sum || 0);
  const rating = (sum + RATING_BASELINE * RATING_PRIOR_COUNT) / (count + RATING_PRIOR_COUNT);
  const clamped = Math.min(5, Math.max(1, rating));

  await trx('users').where({ id: userId }).update({ rating: clamped.toFixed(2), updated_at: new Date() });
}

export async function createReview(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { score_1, score_2, score_3, comment } = req.body;

  const scores = [score_1, score_2, score_3];
  if (scores.some((s) => !Number.isInteger(s) || s < 1 || s > 5)) {
    return res.status(400).json({ code: 40000, data: null, message: '请为每个维度打 1-5 星' });
  }

  const task = await db('tasks').where({ id }).first();
  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });
  if (task.status !== 'completed') {
    return res.status(400).json({ code: 40001, data: null, message: '任务完成后才能评价' });
  }

  const isPublisher = task.publisher_id === req.userId;
  const isAcceptor = task.acceptor_id === req.userId;
  if (!isPublisher && !isAcceptor) {
    return res.status(403).json({ code: 40300, data: null, message: '只有任务双方可以评价' });
  }

  const reviewer_role = isPublisher ? 'publisher' : 'acceptor';
  const reviewee_id = isPublisher ? task.acceptor_id : task.publisher_id;

  const existing = await db('reviews').where({ task_id: id, reviewer_id: req.userId }).first();
  if (existing) {
    return res.status(400).json({ code: 40002, data: null, message: '你已评价过该任务' });
  }

  const overall = Number(((score_1 + score_2 + score_3) / 3).toFixed(2));

  const review = await db.transaction(async (trx) => {
    const [created] = await trx('reviews').insert({
      task_id: parseInt(id),
      reviewer_id: req.userId!,
      reviewee_id,
      reviewer_role,
      score_1,
      score_2,
      score_3,
      overall,
      comment: comment || null,
    }).returning('*');

    await recomputeUserRating(trx, reviewee_id);
    return created;
  });

  emitToUser(reviewee_id, 'review:received', { taskId: task.id, title: task.title });
  await db('notifications').insert({
    user_id: reviewee_id,
    type: 'review_received',
    title: '收到新评价',
    content: `任务"${task.title}"收到一条新评价`,
    related_task_id: task.id,
  });

  res.json({ code: 0, data: review, message: 'ok' });
}

export async function getTaskReviews(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const reviews = await db('reviews')
    .leftJoin('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
    .where('reviews.task_id', id)
    .select(
      'reviews.*',
      'reviewer.nickname as reviewer_nickname',
      'reviewer.username as reviewer_username',
      'reviewer.avatar_url as reviewer_avatar_url'
    )
    .orderBy('reviews.created_at', 'asc');

  res.json({ code: 0, data: reviews, message: 'ok' });
}

async function buildAggregate(userId: number) {
  const agg = await db('reviews')
    .where({ reviewee_id: userId })
    .select(
      db.raw('COUNT(*)::int as count'),
      db.raw('COALESCE(AVG(score_1), 0) as avg_score_1'),
      db.raw('COALESCE(AVG(score_2), 0) as avg_score_2'),
      db.raw('COALESCE(AVG(score_3), 0) as avg_score_3')
    )
    .first();
  const user = await db('users').where({ id: userId }).select('rating').first();
  return {
    rating: Number(user?.rating ?? RATING_BASELINE),
    count: Number(agg?.count || 0),
    avg_score_1: Number(Number(agg?.avg_score_1 || 0).toFixed(2)),
    avg_score_2: Number(Number(agg?.avg_score_2 || 0).toFixed(2)),
    avg_score_3: Number(Number(agg?.avg_score_3 || 0).toFixed(2)),
  };
}

export async function getUserReviews(req: AuthRequest, res: Response) {
  const userId = parseInt(req.params.userId);
  const reviews = await db('reviews')
    .leftJoin('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
    .leftJoin('tasks', 'reviews.task_id', 'tasks.id')
    .where('reviews.reviewee_id', userId)
    .select(
      'reviews.*',
      'reviewer.nickname as reviewer_nickname',
      'reviewer.username as reviewer_username',
      'reviewer.avatar_url as reviewer_avatar_url',
      'tasks.title as task_title'
    )
    .orderBy('reviews.created_at', 'desc');

  const aggregate = await buildAggregate(userId);
  res.json({ code: 0, data: { aggregate, reviews }, message: 'ok' });
}

export async function getGivenReviews(req: AuthRequest, res: Response) {
  const reviews = await db('reviews')
    .leftJoin('users as reviewee', 'reviews.reviewee_id', 'reviewee.id')
    .leftJoin('tasks', 'reviews.task_id', 'tasks.id')
    .where('reviews.reviewer_id', req.userId!)
    .select(
      'reviews.*',
      'reviewee.nickname as reviewee_nickname',
      'reviewee.username as reviewee_username',
      'reviewee.avatar_url as reviewee_avatar_url',
      'tasks.title as task_title'
    )
    .orderBy('reviews.created_at', 'desc');

  res.json({ code: 0, data: reviews, message: 'ok' });
}
