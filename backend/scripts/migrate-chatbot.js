import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function migrateChatbot(db) {
  const name = '004_chatbot_pgvector.js';
  if (await db.schema.hasTable('knex_migrations') && await db('knex_migrations').where({ name }).first())
    return { applied: [] };
  // Explicit name is essential on the existing Supabase schema with older migrations still pending.
  const [, files] = await db.migrate.up({ name });
  return { applied: files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { default: db } = await import('../src/config/database.js');
  try { console.log(JSON.stringify(await migrateChatbot(db), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await db.destroy(); }
}
