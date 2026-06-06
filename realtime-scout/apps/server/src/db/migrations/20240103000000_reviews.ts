import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reviews', (t) => {
    t.increments('id').primary();
    t.integer('task_id').references('id').inTable('tasks').notNullable();
    t.integer('reviewer_id').references('id').inTable('users').notNullable();
    t.integer('reviewee_id').references('id').inTable('users').notNullable();
    t.string('reviewer_role', 20).notNullable();
    t.smallint('score_1').notNullable();
    t.smallint('score_2').notNullable();
    t.smallint('score_3').notNullable();
    t.decimal('overall', 3, 2).notNullable();
    t.text('comment');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['task_id', 'reviewer_id']);
  });

  await knex.raw('CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reviews');
}
