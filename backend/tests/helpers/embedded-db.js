import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite-pgvector';
import PgClient from 'knex/lib/dialects/postgres/index.js';

// Run the real PostgreSQL engine in memory. The one-connection pool preserves transactions.
export const postgres = new PGlite({ extensions: { vector } });
await postgres.waitReady;
export class EmbeddedPgClient extends PgClient {
  async acquireRawConnection() { return postgres; }
  async destroyRawConnection() {}
  async _query(connection, query) {
    const bindings = (query.bindings || []).map(value => value instanceof Date ? value.toISOString() : value);
    const result = bindings.length ? await connection.query(query.sql, bindings) : (await connection.exec(query.sql)).at(-1);
    const command = ({ select: 'SELECT', first: 'SELECT', pluck: 'SELECT', insert: 'INSERT', update: 'UPDATE', del: 'DELETE' })[query.method] || 'RAW';
    query.response = { ...result, rows: result?.rows || [], command, rowCount: result?.affectedRows || 0 };
    return query;
  }
}
