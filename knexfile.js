import { dbConfig } from './config/database.js';

const shared = {
  client: 'pg',
  connection: dbConfig,
  migrations: { directory: './migrations', extension: 'js' },
  seeds: { directory: './seeds', extension: 'js' },
};

export default {
  development: shared,
  test: shared,
  production: shared,
};
