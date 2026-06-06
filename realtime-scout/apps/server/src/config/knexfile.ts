import type { Knex } from 'knex';
import { env } from './env';

const config: Knex.Config = {
  client: 'pg',
  connection: {
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    user: env.db.user,
    password: env.db.password,
  },
  migrations: {
    directory: '../db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: '../db/seeds',
    extension: 'ts',
  },
};

export default config;
