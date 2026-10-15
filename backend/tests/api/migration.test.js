import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import db from '../../src/config/database.js';
import { postgres } from '../helpers/embedded-db.js';
import { up as initial } from '../../database/migrations/001_initial_schema.js';
import { up, down } from '../../database/migrations/002_api_tokens_and_cart.js';
import { up as constraints } from '../../database/migrations/003_legacy_constraints.js';
import { migrateDatabase } from '../../scripts/migrate.js';

after(async () => { await db.destroy(); await postgres.close(); });
test('API migration preserves existing users and pre-existing idempotency history', async () => {
  await initial(db);
  await db('users').insert({ username: 'preserved', name: 'Preserved User', email: 'preserved@example.com', password: 'hash' });
  await db.schema.createTable('idempotency_keys', table => {
    table.increments('id'); table.integer('user_id'); table.string('endpoint'); table.string('idempotency_key'); table.text('request_fingerprint'); table.integer('status_code'); table.jsonb('response_body');
  });
  await db('idempotency_keys').insert({ user_id: 1, endpoint: 'checkout', idempotency_key: 'old', request_fingerprint: 'user:1|courses:1', status_code: 201, response_body: { purchased: 1 } });
  await up(db);
  assert.equal((await db('users').first()).username, 'preserved');
  assert.equal((await db('idempotency_keys').first()).response_body.purchased, 1);
  assert.ok(await db.schema.hasTable('auth_sessions'));
  assert.ok(await db.schema.hasTable('cart_items'));
  await down(db);
  assert.equal(Number((await db('users').count('* as n').first()).n), 1);
  assert.equal(Number((await db('idempotency_keys').count('* as n').first()).n), 1);
});

test('legacy migration runner skips initial schema, removes global watchlist uniqueness and reruns safely', async () => {
  await db.schema.alterTable('watchlist', table => table.unique(['course_id'], { indexName: 'watchlist_course_id_key' }));
  const result = await migrateDatabase(db);
  assert.equal(result.legacyBaseline, true);
  assert.deepEqual(result.applied, ['002_api_tokens_and_cart.js', '003_legacy_constraints.js', '004_chatbot_pgvector.js']);
  assert.equal((await db('users').first()).username, 'preserved');
  const [{ id: userId }] = await db('users').insert({ username: 'second', name: 'Second User', email: 'second@example.com', password: 'hash' }).returning('id');
  const [cat] = await db('categories').insert({ catname: 'Legacy' }).returning('id');
  const [course] = await db('courses').insert({ title: 'Legacy', instructor_id: 1, category_id: cat.id }).returning('id');
  await db('watchlist').insert([{ user_id: 1, course_id: course.id }, { user_id: userId, course_id: course.id }]);
  assert.equal(Number((await db('watchlist').count('* as n').first()).n), 2);
  assert.deepEqual((await migrateDatabase(db)).applied, []);
  await assert.rejects(db('users').insert({ username: 'PRESERVED', name: 'Duplicate', email: 'new@example.com', password: 'hash' }), error => error.code === '23505');
  await constraints(db);
});
