import knex from 'knex';

import './load-env.js';
import { migrationsDirectory, seedsDirectory } from './paths.js';


const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVariables = requiredVariables.filter(name => !process.env[name]);
if (process.env.NODE_ENV !== 'test' && missingVariables.length) throw new Error(`Missing required database environment variables: ${missingVariables.join(', ')}`);

export const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' },
};

const schemaFiles = { migrations: { directory: migrationsDirectory, extension: 'js' }, seeds: { directory: seedsDirectory, extension: 'js' } };
const db = process.env.NODE_ENV === 'test'
  ? knex({ client: (await import('../../tests/helpers/embedded-db.js')).EmbeddedPgClient, connection: {}, pool: { min: 0, max: 1 }, ...schemaFiles })
  : knex({ client: 'pg', connection: dbConfig, pool: { min: 0, max: Number(process.env.DB_POOL_MAX || 10) }, ...schemaFiles });
export default db;
