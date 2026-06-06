import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('messages', (t) => {
    t.increments('id').primary();
    t.integer('task_id').references('id').inTable('tasks').notNullable();
    t.integer('sender_id').references('id').inTable('users').notNullable();
    t.text('content').notNullable();
    t.string('type', 20).defaultTo('text');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_messages_task_id ON messages(task_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('messages');
}
