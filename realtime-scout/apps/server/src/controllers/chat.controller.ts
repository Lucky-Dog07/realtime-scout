import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../config/database';
import { emitToUser } from '../socket';

export async function getMessages(req: AuthRequest, res: Response) {
  const { taskId } = req.params;

  const task = await db('tasks').where('id', taskId).first();
  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });

  if (req.userId !== task.publisher_id && req.userId !== task.acceptor_id) {
    return res.status(403).json({ code: 40300, data: null, message: '无权查看' });
  }

  const messages = await db('messages')
    .where('task_id', taskId)
    .join('users', 'messages.sender_id', 'users.id')
    .select('messages.*', 'users.nickname', 'users.username')
    .orderBy('messages.created_at', 'asc');

  res.json({ code: 0, data: messages });
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const { taskId } = req.params;
  const { content } = req.body;
  const file = req.file as Express.Multer.File | undefined;

  const hasContent = content?.trim();
  const hasFile = !!file;

  if (!hasContent && !hasFile) {
    return res.status(400).json({ code: 40001, data: null, message: '消息不能为空' });
  }

  const task = await db('tasks').where('id', taskId).first();
  if (!task) return res.status(404).json({ code: 40400, data: null, message: '任务不存在' });

  if (req.userId !== task.publisher_id && req.userId !== task.acceptor_id) {
    return res.status(403).json({ code: 40300, data: null, message: '无权发送消息' });
  }

  let msgType = 'text';
  let msgContent = content?.trim() || '';

  if (file) {
    const isVideo = /\.(mp4|mov|avi|webm)$/i.test(file.originalname);
    msgType = isVideo ? 'video' : 'image';
    msgContent = `/uploads/${file.filename}`;
  }

  const [message] = await db('messages').insert({
    task_id: parseInt(taskId),
    sender_id: req.userId!,
    content: msgContent,
    type: msgType,
  }).returning('*');

  const user = await db('users').where('id', req.userId).first();
  const fullMessage = { ...message, nickname: user.nickname, username: user.username };

  const recipientId = req.userId === task.publisher_id ? task.acceptor_id : task.publisher_id;
  if (recipientId) {
    emitToUser(recipientId, 'new_message', { taskId: parseInt(taskId), message: fullMessage });
    await db('notifications').insert({
      user_id: recipientId,
      type: 'new_message',
      title: '收到新消息',
      content: `任务"${task.title}"中收到一条${msgType === 'text' ? '文字' : msgType === 'image' ? '图片' : '视频'}消息`,
      related_task_id: parseInt(taskId),
    });
  }

  res.json({ code: 0, data: fullMessage });
}
