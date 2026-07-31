import 'dotenv/config';
import knex from 'knex';

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
}

export const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'false'
    ? false
    : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' },
};

const db = knex({
  client: 'pg',
  connection: dbConfig,
  pool: { min: 0, max: Number(process.env.DB_POOL_MAX || 10) },
});

export default db;
