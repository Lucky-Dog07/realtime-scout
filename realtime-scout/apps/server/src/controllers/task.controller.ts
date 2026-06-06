import { Request, Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { getDistanceMeters } from '../utils/geo';
import { emitToUser } from '../socket';
import { MIN_REWARD, MAX_DISTANCE_METERS } from '@realtime-scout/shared';

export async function createTask(req: AuthRequest, res: Response) {
  const { title, description, lng, lat, location_name, reward, photo_count, deadline_minutes } = req.body;

  if (!title || !description || !lng || !lat || !location_name || !reward || !deadline_minutes) {
    return res.status(400).json({ code: 40000, data: null, message: '缺少必填字段' });
  }
  if (reward < MIN_REWARD) {
    return res.status(400).json({ code: 40001, data: null, message: `悬赏金额不能低于${MIN_REWARD}元` });
  }

  const user = await db('users').where({ id: req.userId }).first();
  if (user.balance < reward) {
    return res.status(400).json({ code: 40002, data: null, message: '余额不足，请先充值' });
  }

  const deadline = new Date(Date.now() + deadline_minutes * 60 * 1000);

  const task = await db.transaction(async (trx) => {
    await trx('users').where({ id: req.userId }).decrement('balance', reward);
    await trx('users').where({ id: req.userId }).increment('frozen_balance', reward);
    const updatedUser = await trx('users').where({ id: req.userId }).first();

    await trx('transactions').insert({
      user_id: req.userId,
      type: 'freeze',
      amount: -reward,
      balance_after: updatedUser.balance,
      related_task_id: null,
      description: '发布任务冻结',
    });

    const [newTask] = await trx('tasks').insert({
      publisher_id: req.userId,
      title,
      description,
      location: trx.raw(`ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography`, [lng, lat]),
      location_name,
      reward,
      photo_count: photo_count || 1,
      deadline,
    }).returning('*');

    await trx('transactions').where({
      user_id: req.userId,
      type: 'freeze',
      related_task_id: null,
    }).orderBy('created_at', 'desc').limit(1).update({ related_task_id: newTask.id });

    await trx('users').where({ id: req.userId }).increment('total_published', 1);

    return newTask;
  });

  res.json({ code: 0, data: task, message: 'ok' });
}

export async function getNearbyTasks(req: Request, res: Response) {
  const lng = parseFloat(req.query.lng as string);
  const lat = parseFloat(req.query.lat as string);
  const radius = parseFloat(req.query.radius as string) || 5000;
  if (!lng || !lat) {
    return res.status(400).json({ code: 40000, data: null, message: '缺少经纬度参数' });
  }

  const tasks = await db('tasks')
    .select(
      'tasks.*',
      db.raw(`ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) as distance`, [lng, lat]),
      db.raw(`ST_X(location::geometry) as lng`),
      db.raw(`ST_Y(location::geometry) as lat`)
    )
    .where('status', 'pending')
    .whereRaw(`ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)`, [lng, lat, radius])
    .where('deadline', '>', new Date())
    .orderBy('distance', 'asc')
    .limit(50);

  res.json({ code: 0, data: tasks, message: 'ok' });
}

export async function getTaskById(req: Request, res: Response) {
  const { id } = req.params;
  const task = await db('tasks')
    .select('tasks.*', db.raw(`ST_X(location::geometry) as lng`), db.raw(`ST_Y(location::geometry) as lat`))
    .where('tasks.id', id)
    .first();

  if (!task) {
    return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });
  }

  const submission = await db('submissions').where({ task_id: id }).first();
  let photos: any[] = [];
  if (submission) {
    photos = await db('submission_photos').where({ submission_id: submission.id });
  }

  const publisher = await db('users').where({ id: task.publisher_id }).select('id', 'nickname', 'username', 'avatar_url').first();
  const acceptor = task.acceptor_id
    ? await db('users').where({ id: task.acceptor_id }).select('id', 'nickname', 'username', 'avatar_url').first()
    : null;

  res.json({
    code: 0,
    data: { ...task, submission: submission ? { ...submission, photos } : null, publisher, acceptor },
    message: 'ok',
  });
}

export async function acceptTask(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { lng, lat } = req.body;
  const task = await db('tasks')
    .select('tasks.*', db.raw(`ST_X(location::geometry) as task_lng`), db.raw(`ST_Y(location::geometry) as task_lat`))
    .where('tasks.id', id)
    .first();

  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });
  if (task.status !== 'pending') return res.status(400).json({ code: 40001, data: null, message: '任务不可接单' });
  if (task.publisher_id === req.userId) return res.status(400).json({ code: 40002, data: null, message: '不能接自己的任务' });
  if (new Date(task.deadline) < new Date()) return res.status(400).json({ code: 40003, data: null, message: '任务已过期' });

  if (lng && lat) {
    const distance = getDistanceMeters(parseFloat(lat), parseFloat(lng), task.task_lat, task.task_lng);
    if (distance > MAX_DISTANCE_METERS) {
      return res.status(400).json({ code: 40004, data: null, message: `距离任务地点${Math.round(distance)}米，超出${MAX_DISTANCE_METERS}米接单范围` });
    }
  } else {
    return res.status(400).json({ code: 40005, data: null, message: '需要获取您的位置才能接单' });
  }

  await db('tasks').where({ id }).update({
    status: 'accepted',
    acceptor_id: req.userId,
    accepted_at: new Date(),
    updated_at: new Date(),
  });

  emitToUser(task.publisher_id, 'task:accepted', { taskId: task.id, title: task.title });
  await db('notifications').insert({
    user_id: task.publisher_id,
    type: 'task_accepted',
    title: '你的任务已被接单',
    content: `任务"${task.title}"已有人接单`,
    related_task_id: task.id,
  });

  res.json({ code: 0, data: null, message: '接单成功' });
}

export async function submitTask(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { description, lng, lat } = req.body;
  const files = req.files as Express.Multer.File[];

  const task = await db('tasks')
    .select('tasks.*', db.raw(`ST_X(location::geometry) as task_lng`), db.raw(`ST_Y(location::geometry) as task_lat`))
    .where('tasks.id', id)
    .first();

  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });
  if (task.status !== 'accepted') return res.status(400).json({ code: 40001, data: null, message: '任务状态不正确' });
  if (task.acceptor_id !== req.userId) return res.status(403).json({ code: 40300, data: null, message: '你不是接单者' });
  if (!files || files.length < task.photo_count) {
    return res.status(400).json({ code: 40002, data: null, message: `请上传至少${task.photo_count}张照片` });
  }

  let distance: number | null = null;
  if (lng && lat) {
    distance = getDistanceMeters(parseFloat(lat), parseFloat(lng), task.task_lat, task.task_lng);
    if (distance > MAX_DISTANCE_METERS) {
      return res.status(400).json({ code: 40003, data: null, message: `距离任务地点${Math.round(distance)}米，超出${MAX_DISTANCE_METERS}米限制` });
    }
  }

  await db.transaction(async (trx) => {
    const [submission] = await trx('submissions').insert({
      task_id: parseInt(id),
      acceptor_id: req.userId!,
      description: description || null,
      submit_lng: lng ? parseFloat(lng) : null,
      submit_lat: lat ? parseFloat(lat) : null,
      distance_to_task: distance,
    }).returning('*');

    for (const file of files) {
      await trx('submission_photos').insert({
        submission_id: submission.id,
        photo_url: `/uploads/${file.filename}`,
      });
    }

    await trx('tasks').where({ id }).update({
      status: 'submitted',
      submitted_at: new Date(),
      updated_at: new Date(),
    });
  });

  emitToUser(task.publisher_id, 'task:submitted', { taskId: task.id, title: task.title });
  await db('notifications').insert({
    user_id: task.publisher_id,
    type: 'task_submitted',
    title: '任务已提交',
    content: `任务"${task.title}"已提交结果，请查看`,
    related_task_id: task.id,
  });

  res.json({ code: 0, data: null, message: '提交成功' });
}

export async function cancelTask(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const task = await db('tasks').where({ id }).first();

  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });
  if (task.publisher_id !== req.userId) return res.status(403).json({ code: 40300, data: null, message: '无权操作' });
  if (task.status !== 'pending') return res.status(400).json({ code: 40001, data: null, message: '只能取消待接单的任务' });

  await db.transaction(async (trx) => {
    await trx('tasks').where({ id }).update({ status: 'cancelled', updated_at: new Date() });
    await trx('users').where({ id: req.userId }).increment('balance', task.reward);
    await trx('users').where({ id: req.userId }).decrement('frozen_balance', task.reward);
    const user = await trx('users').where({ id: req.userId }).first();
    await trx('transactions').insert({
      user_id: req.userId,
      type: 'unfreeze',
      amount: task.reward,
      balance_after: user.balance,
      related_task_id: task.id,
      description: '取消任务退款',
    });
  });

  res.json({ code: 0, data: null, message: '已取消' });
}

export async function confirmTask(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const task = await db('tasks').where({ id }).first();

  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });
  if (task.publisher_id !== req.userId) return res.status(403).json({ code: 40300, data: null, message: '无权操作' });
  if (task.status !== 'submitted') return res.status(400).json({ code: 40001, data: null, message: '任务状态不正确' });

  await db.transaction(async (trx) => {
    await trx('tasks').where({ id }).update({ status: 'completed', confirmed_at: new Date(), updated_at: new Date() });
    await trx('users').where({ id: task.publisher_id }).decrement('frozen_balance', task.reward);
    const publisher = await trx('users').where({ id: task.publisher_id }).first();
    await trx('transactions').insert({
      user_id: task.publisher_id,
      type: 'pay_out',
      amount: -task.reward,
      balance_after: publisher.balance,
      related_task_id: task.id,
      description: '任务结算支出',
    });

    await trx('users').where({ id: task.acceptor_id }).increment('balance', task.reward);
    const acceptor = await trx('users').where({ id: task.acceptor_id }).first();
    await trx('transactions').insert({
      user_id: task.acceptor_id,
      type: 'earn',
      amount: task.reward,
      balance_after: acceptor.balance,
      related_task_id: task.id,
      description: '任务完成收入',
    });

    await trx('users').where({ id: task.acceptor_id }).increment('total_completed', 1);
  });

  emitToUser(task.acceptor_id, 'task:confirmed', { taskId: task.id, title: task.title, reward: task.reward });
  await db('notifications').insert({
    user_id: task.acceptor_id,
    type: 'task_confirmed',
    title: '任务已确认',
    content: `任务"${task.title}"已确认，${task.reward}元已到账`,
    related_task_id: task.id,
  });

  await db('notifications').insert([
    {
      user_id: task.acceptor_id,
      type: 'review_invite',
      title: '邀请你评价',
      content: `任务"${task.title}"已完成，快去评价对方吧`,
      related_task_id: task.id,
    },
    {
      user_id: task.publisher_id,
      type: 'review_invite',
      title: '邀请你评价',
      content: `任务"${task.title}"已完成，快去评价对方吧`,
      related_task_id: task.id,
    },
  ]);

  res.json({ code: 0, data: null, message: '已确认' });
}

export async function rejectTask(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;
  const task = await db('tasks').where({ id }).first();

  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });
  if (task.publisher_id !== req.userId) return res.status(403).json({ code: 40300, data: null, message: '无权操作' });
  if (task.status !== 'submitted') return res.status(400).json({ code: 40001, data: null, message: '任务状态不正确' });

  await db('tasks').where({ id }).update({ status: 'accepted', submitted_at: null, updated_at: new Date() });
  await db('submissions').where({ task_id: id }).update({ status: 'rejected' });

  emitToUser(task.acceptor_id, 'task:rejected', { taskId: task.id, title: task.title, reason });
  await db('notifications').insert({
    user_id: task.acceptor_id,
    type: 'task_rejected',
    title: '提交被拒绝',
    content: `任务"${task.title}"提交被拒绝${reason ? '：' + reason : ''}，请重新提交`,
    related_task_id: task.id,
  });

  res.json({ code: 0, data: null, message: '已拒绝' });
}

export async function giveUpTask(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const task = await db('tasks').where({ id }).first();

  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });
  if (task.acceptor_id !== req.userId) return res.status(403).json({ code: 40300, data: null, message: '你不是接单者' });
  if (task.status !== 'accepted') return res.status(400).json({ code: 40001, data: null, message: '当前状态无法放弃' });

  await db('tasks').where({ id }).update({
    status: 'pending',
    acceptor_id: null,
    accepted_at: null,
    updated_at: new Date(),
  });

  emitToUser(task.publisher_id, 'task:giveup', { taskId: task.id, title: task.title });
  await db('notifications').insert({
    user_id: task.publisher_id,
    type: 'task_giveup',
    title: '接单者已放弃',
    content: `任务"${task.title}"的接单者已放弃，任务重新开放接单`,
    related_task_id: task.id,
  });

  res.json({ code: 0, data: null, message: '已放弃任务' });
}

export async function getMyPublished(req: AuthRequest, res: Response) {
  const tasks = await db('tasks')
    .select('tasks.*', db.raw(`ST_X(location::geometry) as lng`), db.raw(`ST_Y(location::geometry) as lat`))
    .where({ publisher_id: req.userId })
    .orderBy('created_at', 'desc');
  res.json({ code: 0, data: tasks, message: 'ok' });
}

export async function getMyAccepted(req: AuthRequest, res: Response) {
  const tasks = await db('tasks')
    .select('tasks.*', db.raw(`ST_X(location::geometry) as lng`), db.raw(`ST_Y(location::geometry) as lat`))
    .where({ acceptor_id: req.userId })
    .orderBy('accepted_at', 'desc');
  res.json({ code: 0, data: tasks, message: 'ok' });
}
