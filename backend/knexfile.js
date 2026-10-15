import { dbConfig } from './src/config/database.js';
import { migrationsDirectory, seedsDirectory } from './src/config/paths.js';

const shared = {
  client: 'pg',
  connection: dbConfig,
  migrations: { directory: migrationsDirectory, extension: 'js' },
  seeds: { directory: seedsDirectory, extension: 'js' },
};

export default {
  development: shared,
  test: shared,
  production: shared,
};
