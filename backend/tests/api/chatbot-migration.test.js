import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import db from '../../src/config/database.js';
import { postgres } from '../helpers/embedded-db.js';
import { up as initial } from '../../database/migrations/001_initial_schema.js';
import { migrateChatbot } from '../../scripts/migrate-chatbot.js';

after(async () => { await db.destroy(); await postgres.close(); });

test('targeted migration only adds the chatbot schema on legacy databases and is rerunnable', async () => {
  await initial(db);
  await db('users').insert({ username: 'preserved', name: 'Preserved', email: 'preserved@example.test', password: 'hash' });
  assert.deepEqual((await migrateChatbot(db)).applied, ['004_chatbot_pgvector.js']);
  assert.equal((await db('users').first()).username, 'preserved');
  assert.equal(await db.schema.hasTable('auth_sessions'), false, 'unrelated pending migrations must not run');
  assert.deepEqual((await db('knex_migrations').select('name')).map(row => row.name), ['004_chatbot_pgvector.js']);
  assert.deepEqual((await migrateChatbot(db)).applied, []);
  const type = (await db.raw("SELECT format_type(atttypid, atttypmod) AS type FROM pg_attribute WHERE attrelid = 'public.chatbot_chunks'::regclass AND attname = 'embedding'")).rows[0].type;
  assert.match(type, /vector\(1024\)$/);
  await assert.rejects(db('chatbot_chunks').insert({ id: 'invalid', audience: 'public', title: 'bad', url: '/courses', text: 'bad', text_hash: 'bad', embedding: '[1,2]' }), /1024|dimensions/i);
});

test('RLS prevents a browser-style database role from reading either chatbot table', async () => {
  await db.raw('CREATE ROLE chatbot_test_visitor NOLOGIN');
  await db.raw('GRANT USAGE ON SCHEMA public TO chatbot_test_visitor');
  await db.raw('GRANT SELECT ON public.chatbot_chunks, public.chatbot_index_state TO chatbot_test_visitor');
  await db('chatbot_index_state').insert({ id: 1, signature: 'private', snapshot_hash: 'private', embedding_model: 'qwen3-embedding:0.6b', dimensions: 1024 });
  const vector = JSON.stringify(Array(1024).fill(0.01));
  await db('chatbot_chunks').insert({ id: 'secret', audience: 'admin', title: 'secret', url: '/admin', text: 'secret', text_hash: 'secret', embedding: vector });
  await db.transaction(async connection => {
    await connection.raw('SET LOCAL ROLE chatbot_test_visitor');
    assert.equal((await connection('chatbot_chunks').select('*')).length, 0);
    assert.equal((await connection('chatbot_index_state').select('*')).length, 0);
  });
});
