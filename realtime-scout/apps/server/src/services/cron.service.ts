import cron from 'node-cron';
import db from '../config/database';
import { emitToUser } from '../socket';

export function startCronJobs() {
  cron.schedule('* * * * *', async () => {
    try {
      const expiredTasks = await db('tasks')
        .whereIn('status', ['pending', 'accepted'])
        .where('deadline', '<', new Date())
        .select('*');

      for (const task of expiredTasks) {
        await db.transaction(async (trx) => {
          await trx('tasks').where({ id: task.id }).update({ status: 'expired', updated_at: new Date() });
          await trx('users').where({ id: task.publisher_id }).increment('balance', task.reward);
          await trx('users').where({ id: task.publisher_id }).decrement('frozen_balance', task.reward);
          const user = await trx('users').where({ id: task.publisher_id }).first();
          await trx('transactions').insert({
            user_id: task.publisher_id,
            type: 'unfreeze',
            amount: task.reward,
            balance_after: user.balance,
            related_task_id: task.id,
            description: '任务过期退款',
          });
        });

        emitToUser(task.publisher_id, 'task:expired', { taskId: task.id, title: task.title });
        await db('notifications').insert({
          user_id: task.publisher_id,
          type: 'task_expired',
          title: '任务已过期',
          content: `任务"${task.title}"已过期，悬赏金已退回`,
          related_task_id: task.id,
        });
      }

      // Auto-confirm submitted tasks after 24 hours
      const autoConfirmTasks = await db('tasks')
        .where('status', 'submitted')
        .whereRaw(`submitted_at < NOW() - INTERVAL '24 hours'`)
        .select('*');

      for (const task of autoConfirmTasks) {
        await db.transaction(async (trx) => {
          await trx('tasks').where({ id: task.id }).update({ status: 'completed', confirmed_at: new Date(), updated_at: new Date() });
          await trx('users').where({ id: task.publisher_id }).decrement('frozen_balance', task.reward);
          await trx('users').where({ id: task.acceptor_id }).increment('balance', task.reward);
          const acceptor = await trx('users').where({ id: task.acceptor_id }).first();
          await trx('transactions').insert({
            user_id: task.acceptor_id,
            type: 'earn',
            amount: task.reward,
            balance_after: acceptor.balance,
            related_task_id: task.id,
            description: '任务自动确认收入',
          });
          await trx('users').where({ id: task.acceptor_id }).increment('total_completed', 1);
        });

        emitToUser(task.acceptor_id, 'task:confirmed', { taskId: task.id, title: task.title, reward: task.reward });
      }
    } catch (err) {
      console.error('Cron job error:', err);
    }
  });
}
