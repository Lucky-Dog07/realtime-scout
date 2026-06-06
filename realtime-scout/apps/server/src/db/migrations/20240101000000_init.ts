import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');

  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('username', 50).unique().notNullable();
    t.string('password_hash', 255).notNullable();
    t.string('nickname', 50);
    t.string('avatar_url', 500);
    t.string('phone', 20);
    t.decimal('balance', 10, 2).defaultTo(0);
    t.decimal('frozen_balance', 10, 2).defaultTo(0);
    t.decimal('rating', 3, 2).defaultTo(5.0);
    t.integer('total_published').defaultTo(0);
    t.integer('total_completed').defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('tasks', (t) => {
    t.increments('id').primary();
    t.integer('publisher_id').references('id').inTable('users').notNullable();
    t.integer('acceptor_id').references('id').inTable('users');
    t.string('title', 100).notNullable();
    t.text('description').notNullable();
    t.specificType('location', 'geography(POINT, 4326)').notNullable();
    t.string('location_name', 200).notNullable();
    t.decimal('reward', 10, 2).notNullable();
    t.integer('photo_count').defaultTo(1);
    t.string('status', 20).defaultTo('pending');
    t.timestamp('deadline').notNullable();
    t.timestamp('accepted_at');
    t.timestamp('submitted_at');
    t.timestamp('confirmed_at');
    t.timestamps(true, true);
  });

  await knex.raw('CREATE INDEX idx_tasks_location ON tasks USING GIST(location)');
  await knex.raw('CREATE INDEX idx_tasks_status ON tasks(status)');

  await knex.schema.createTable('submissions', (t) => {
    t.increments('id').primary();
    t.integer('task_id').references('id').inTable('tasks').notNullable();
    t.integer('acceptor_id').references('id').inTable('users').notNullable();
    t.text('description');
    t.decimal('submit_lng', 12, 8);
    t.decimal('submit_lat', 12, 8);
    t.decimal('distance_to_task', 10, 2);
    t.string('status', 20).defaultTo('pending');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('submission_photos', (t) => {
    t.increments('id').primary();
    t.integer('submission_id').references('id').inTable('submissions').notNullable();
    t.string('photo_url', 500).notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('transactions', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').notNullable();
    t.string('type', 30).notNullable();
    t.decimal('amount', 10, 2).notNullable();
    t.decimal('balance_after', 10, 2).notNullable();
    t.integer('related_task_id').references('id').inTable('tasks');
    t.string('description', 200);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('notifications', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').notNullable();
    t.string('type', 30).notNullable();
    t.string('title', 100).notNullable();
    t.text('content');
    t.integer('related_task_id').references('id').inTable('tasks');
    t.boolean('is_read').defaultTo(false);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('submission_photos');
  await knex.schema.dropTableIfExists('submissions');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('users');
}
