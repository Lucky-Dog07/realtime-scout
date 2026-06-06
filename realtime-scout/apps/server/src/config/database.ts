import knex from 'knex';
import { env } from './env';

const db = knex({
  client: 'pg',
  connection: {
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
  },
});

export default db;
