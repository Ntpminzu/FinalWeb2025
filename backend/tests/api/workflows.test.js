import assert from 'node:assert/strict';
import { before, after, test, mock } from 'node:test';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../../src/app.js';
import db from '../../src/config/database.js';
import { env } from '../../src/config/env.js';
import { postgres } from '../helpers/embedded-db.js';
import IdempotencyRepository from '../../src/modules/cart/repositories/idempotency.repository.js';

const api = '/api/v1';
const tokens = {};
const userIds = {};
const auth = (method, path, role = 'student') => request(app)[method](`${api}${path}`).auth(tokens[role], { type: 'bearer' });
async function login(username) {
  const response = await request(app).post(`${api}/auth/login`).send({ username, password: 'password123' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response;
}
before(async () => {
  await db.migrate.latest();
  const hash = await bcrypt.hash('password123', 4);
  for (const [name, permission] of [['student', 1], ['other', 1], ['teacher', 2], ['outsider', 2], ['admin', 3]]) {
    const [user] = await db('users').insert({ username: name, name: `Test ${name}`, email: `${name}@example.com`, password: hash, permission }).returning('*');
    userIds[name] = user.id;
    if (permission === 2) await db('instructors').insert({ user_id: user.id });
    tokens[name] = (await login(name)).body.data.accessToken;
  }
  await db('categories').insert([{ id: 1, catname: 'Programming' }, { id: 2, catname: 'Child', parent_id: 1 }]);
  await db('courses').insert([{ id: 1, title: 'Node basics', instructor_id: userIds.teacher, category_id: 1, price: 100, sale_price: 0 }, { id: 2, title: 'Other course', instructor_id: userIds.outsider, category_id: 2, price: 200 }]);
  await db.raw("SELECT setval(pg_get_serial_sequence('courses', 'id'), 2)");
  await db.raw("SELECT setval(pg_get_serial_sequence('categories', 'id'), 2)");
  await db('lectures').insert([{ id: 1, course_id: 1, title: 'Introduction', video_url: 'https://example.com/lesson.mp4', duration_sec: 100 }, { id: 2, course_id: 2, title: 'Other lecture', video_url: 'https://example.com/other.mp4', duration_sec: 100 }]);
  await db.raw("SELECT setval(pg_get_serial_sequence('lectures', 'id'), 2)");
});
after(async () => { await db.destroy(); await postgres.close(); });

test('public catalog, filtering, home and JSON errors', async () => {
  for (const path of ['/home', '/courses', '/courses/1', '/categories', '/categories/1/courses', '/auth/username-availability?username=unused']) {
    const response = await request(app).get(api + path);
    assert.equal(response.status, 200, `${path}: ${JSON.stringify(response.body)}`);
    assert.equal(response.headers['set-cookie'], undefined, 'public API must not start a web session');
  }
  const filtered = await request(app).get(`${api}/courses?q=Node&sort=rating_desc`);
  assert.equal(filtered.status, 200, JSON.stringify(filtered.body));
  assert.equal(filtered.body.data[0].id, 1);
  assert.equal((await request(app).get(`${api}/courses/abc`)).status, 400);
  assert.equal((await request(app).get(`${api}/courses/99999`)).status, 404);
  assert.equal((await request(app).post(`${api}/auth/login`).set('Content-Type', 'application/json').send('{broken')).status, 400);
  assert.equal((await request(app).post(`${api}/auth/login`).type('form').send({ username: 'student' })).status, 415);
});

test('JWT rejects forged, expired, wrong audience and session-cookie credentials', async () => {
  const claims = jwt.decode(tokens.student);
  const sign = (payload, secret = env.jwtSecret, options = {}) => jwt.sign(payload, secret, { algorithm: 'HS256', issuer: env.jwtIssuer, audience: env.jwtAudience, ...options });
  for (const token of [tokens.student + 'x', sign({ sub: String(userIds.student), sid: claims.sid, type: 'access', exp: 1 }), sign({ sub: String(userIds.student), sid: claims.sid, type: 'access' }, env.jwtSecret, { audience: 'wrong' }), sign({ sub: String(userIds.student), sid: claims.sid, type: 'refresh' })]) {
    assert.equal((await request(app).get(`${api}/auth/me`).auth(token, { type: 'bearer' })).status, 401);
  }
  assert.equal((await request(app).get(`${api}/auth/me`).set('Cookie', 'online_academy.sid=fake')).status, 401);
  assert.equal((await auth('get', '/admin/users')).status, 403);
  assert.equal((await auth('get', '/instructor/courses')).status, 403);
  assert.equal((await auth('get', '/cart', 'teacher')).status, 403);
});

test('registration, refresh rotation, CSRF, replay revocation and logout', async () => {
  const registration = await request(app).post(`${api}/auth/register`).send({ username: 'registered', name: 'New Student', email: 'registered@example.com', password: 'password123', confirmPassword: 'password123', permission: 3 });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  assert.equal(registration.body.data.user.permission, 1);
  assert.equal(registration.body.data.user.password, undefined);
  const cookie = registration.headers['set-cookie'][0].split(';')[0];
  assert.match(registration.headers['set-cookie'][0], /HttpOnly/);
  const csrf = (await request(app).get(`${api}/auth/csrf-token`).set('Cookie', cookie)).body.data.csrfToken;
  assert.equal((await request(app).post(`${api}/auth/refresh`).set('Cookie', cookie)).status, 403);
  const rotated = await request(app).post(`${api}/auth/refresh`).set('Cookie', cookie).set('x-csrf-token', csrf).send({});
  assert.equal(rotated.status, 200, JSON.stringify(rotated.body));
  assert.notEqual(rotated.headers['set-cookie'][0].split(';')[0], cookie);
  const replay = await request(app).post(`${api}/auth/refresh`).set('Cookie', cookie).set('x-csrf-token', csrf).send({});
  assert.equal(replay.status, 401);
  assert.equal((await request(app).get(`${api}/auth/me`).auth(rotated.body.data.accessToken, { type: 'bearer' })).status, 401);
  const fresh = await login('registered');
  const token = fresh.body.data.accessToken;
  assert.equal((await request(app).post(`${api}/auth/logout`).auth(token, { type: 'bearer' })).status, 204);
  assert.equal((await request(app).get(`${api}/auth/me`).auth(token, { type: 'bearer' })).status, 401);
});

test('account profile is partial; password errors stay 400 and password change revokes tokens', async () => {
  const response = await auth('patch', '/me/profile').send({ name: 'Updated Student' });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.data.email, 'student@example.com');
  assert.equal((await auth('patch', '/me/password').send({ currentPassword: 'wrong', newPassword: 'newpassword123', confirmPassword: 'newpassword123' })).status, 400);
  const disposable = await login('registered');
  const token = disposable.body.data.accessToken;
  const changed = await request(app).patch(`${api}/me/password`).auth(token, { type: 'bearer' }).send({ currentPassword: 'password123', newPassword: 'newpassword123', confirmPassword: 'newpassword123' });
  assert.equal(changed.status, 204, JSON.stringify(changed.body));
  assert.equal((await request(app).get(`${api}/auth/me`).auth(token, { type: 'bearer' })).status, 401);
});

test('watchlist add is idempotent and isolated per account', async () => {
  for (let i = 0; i < 2; i++) assert.equal((await auth('post', '/me/watchlist/items').send({ courseId: 1 })).status, 200);
  const response = await auth('get', '/me/watchlist');
  assert.equal(response.body.data.length, 1);
  assert.equal(response.body.data[0].id, 1);
  assert.equal((await auth('get', '/me/watchlist', 'other')).body.data.length, 0);
  assert.equal((await auth('delete', '/me/watchlist/items/1')).status, 204);
});

test('persistent cart, server prices, atomic checkout and idempotent/concurrent retries', async () => {
  assert.equal((await auth('post', '/cart/items').send({ courseId: 1, price: 999 })).status, 200);
  assert.equal((await auth('post', '/cart/items').send({ courseId: 1 })).body.data.courses.length, 1);
  assert.equal((await auth('get', '/cart')).body.data.total, 0, 'zero sale price must stay zero');
  assert.equal((await auth('get', '/cart', 'other')).body.data.empty, true);
  assert.equal((await auth('post', '/checkout').send({ idempotencyKey: 'bad-snapshot', courseIds: [2] })).status, 409);
  assert.equal(Number((await db('purchased').count('* as n').first()).n), 0);
  const attempts = await Promise.all([auth('post', '/checkout').send({ idempotencyKey: 'first', courseIds: [1] }), auth('post', '/checkout').send({ idempotencyKey: 'first', courseIds: [1] })]);
  assert.deepEqual(attempts.map(item => item.status).sort(), [200, 201]);
  assert.equal(Number((await db('purchased').where({ user_id: userIds.student, course_id: 1 }).count('* as n').first()).n), 1);
  assert.equal((await auth('get', '/cart')).body.data.empty, true);
  assert.equal((await auth('post', '/checkout').send({ idempotencyKey: 'first', courseIds: [2] })).status, 409);
  assert.equal((await auth('post', '/cart/items').send({ courseId: 1 })).status, 409);
  assert.equal((await auth('post', '/cart/items').send({ courseId: 2 })).status, 200);
  assert.equal((await auth('delete', '/cart/items/2')).status, 200);
  assert.equal((await auth('delete', '/cart')).body.data.empty, true);
});

test('learning ownership, resume progress, trusted duration and review lifecycle', async () => {
  assert.equal((await auth('get', '/me/courses')).body.data[0].courseId, 1);
  assert.equal((await auth('get', '/me/courses/1/lectures/1', 'other')).status, 403);
  assert.equal((await auth('get', '/me/courses/1/lectures/999')).status, 404);
  assert.equal((await auth('patch', '/me/lectures/2/progress').send({ lecture_id: 1, lastSecond: 95 })).status, 403, 'body cannot override the lecture ID in the URL');
  assert.equal((await auth('post', '/courses/1/reviews').send({ rating: 5 })).status, 403);
  assert.equal((await auth('patch', '/me/lectures/1/duration').send({ durationSec: 1 })).status, 409);
  assert.equal((await auth('patch', '/me/lectures/1/duration').send({ durationSec: 100 })).status, 200);
  assert.equal((await auth('patch', '/me/lectures/1/progress').send({ lastSecond: 95 })).status, 200);
  const detail = await auth('get', '/me/courses/1/lectures/1');
  assert.equal(detail.body.data.progress.lastSecond, 95);
  const progress = await auth('get', '/me/courses/1/progress');
  assert.equal(progress.body.data.completion.percent, 100);
  assert.equal(progress.body.data.progress[0].isCompleted, true);
  assert.equal((await auth('patch', '/me/lectures/1/progress').send({ lastSecond: 10 })).body.data.lastSecond, 95);
  const context = await auth('get', '/courses/1/reviews/me');
  assert.equal(context.body.data.canReview, true);
  assert.equal(context.body.data.review, null);
  assert.equal((await auth('patch', '/courses/1/reviews/me').send({ rating: 4 })).status, 404);
  assert.equal((await auth('post', '/courses/1/reviews').send({ rating: 5, comment: 'Good' })).status, 201);
  assert.equal((await auth('post', '/courses/1/reviews').send({ rating: 5 })).status, 409);
  assert.equal((await auth('patch', '/courses/1/reviews/me').send({ rating: 4, comment: 'Updated' })).status, 200);
  assert.equal(Number((await db('courses').where('id', 1).first()).rating_avg), 4);
});

test('checkout rolls back purchases and retains cart if saving the receipt fails', async () => {
  await auth('post', '/cart/items', 'other').send({ courseId: 2 });
  const failure = mock.method(IdempotencyRepository, 'save', async () => { throw new Error('Injected receipt storage failure'); });
  try {
    const response = await auth('post', '/checkout', 'other').send({ idempotencyKey: 'rollback', courseIds: [2] });
    assert.equal(response.status, 500);
    assert.equal(Number((await db('purchased').where('user_id', userIds.other).count('* as n').first()).n), 0);
    assert.equal((await auth('get', '/cart', 'other')).body.data.courses[0].id, 2);
  } finally { failure.mock.restore(); }
  await auth('delete', '/cart', 'other');
});

test('instructor course/lecture lifecycle enforces ownership and explicit completion', async () => {
  assert.equal((await auth('get', '/instructor/dashboard', 'teacher')).status, 200);
  assert.equal((await auth('get', '/instructor/courses', 'teacher')).status, 200);
  assert.equal((await auth('get', '/instructor/courses/2', 'teacher')).status, 404);
  const create = await auth('post', '/instructor/courses', 'teacher').send({ title: 'API course', categoryId: 1, price: 100, salePrice: 0, fullDescription: 'Description' });
  assert.equal(create.status, 201, JSON.stringify(create.body));
  const id = create.body.data.id;
  const updated = await auth('patch', `/instructor/courses/${id}`, 'teacher').send({ title: 'Updated API course' });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(updated.body.data.salePrice, 0);
  assert.equal((await auth('patch', `/instructor/courses/${id}/status`, 'teacher').send({ isCompleted: true })).status, 400);
  const added = await auth('post', `/instructor/courses/${id}/lectures`, 'teacher').send({ title: 'Lecture', videoUrl: 'https://example.com/video.mp4', durationSec: 120 });
  assert.equal(added.status, 201, JSON.stringify(added.body));
  const lectureId = added.body.data.id;
  assert.equal((await auth('get', `/instructor/courses/${id}/lectures`, 'teacher')).body.data[0].durationSec, 120);
  assert.equal((await auth('patch', `/instructor/lectures/${lectureId}`, 'teacher').send({ durationSec: 130 })).body.data.durationSec, 130);
  assert.equal((await auth('delete', `/instructor/lectures/${lectureId}`, 'outsider')).status, 404);
  for (let i = 0; i < 2; i++) assert.equal((await auth('patch', `/instructor/courses/${id}/status`, 'teacher').send({ isCompleted: true })).body.data.isCompleted, true);
  assert.equal((await auth('delete', `/instructor/lectures/${lectureId}`, 'teacher')).status, 204);
  assert.equal((await auth('delete', `/instructor/courses/${id}`, 'teacher')).status, 204);
  assert.equal((await auth('delete', '/instructor/courses/1', 'teacher')).status, 409, 'purchased course cannot be deleted');
  assert.equal((await auth('patch', '/instructor/profile', 'teacher').send({ bio: 'Teacher bio', specialization: 'Node.js' })).body.data.bio, 'Teacher bio');
  assert.equal((await auth('get', '/instructor/profile', 'teacher')).body.data.specialization, 'Node.js');
});

test('admin filters, category conflicts, status, promotion and safe deletion', async () => {
  for (const path of ['/admin/dashboard', '/admin/courses', '/admin/categories']) assert.equal((await auth('get', path, 'admin')).status, 200, path);
  const filtered = await auth('get', '/admin/users?permission=1&q=student&limit=1', 'admin');
  assert.equal(filtered.body.data.length, 1);
  assert.equal(filtered.body.data[0].isDisabled, false);
  assert.equal(filtered.body.data[0].password, undefined);
  assert.equal((await auth('patch', `/admin/users/${userIds.admin}/status`, 'admin').send({ isDisabled: true })).status, 403);
  assert.equal((await auth('patch', `/admin/users/${userIds.other}/role`, 'admin').send({ permission: 3 })).status, 400);
  assert.equal((await auth('patch', `/admin/users/${userIds.other}/role`, 'admin').send({ permission: 2 })).status, 200);
  assert.equal((await auth('get', '/instructor/profile', 'other')).status, 200, 'current DB role takes effect immediately');
  assert.equal((await auth('patch', `/admin/users/${userIds.other}/status`, 'admin').send({ isDisabled: 'false' })).status, 400);
  assert.equal((await auth('patch', `/admin/users/${userIds.other}/status`, 'admin').send({ isDisabled: true })).status, 200);
  assert.equal((await auth('get', '/auth/me', 'other')).status, 401, 'disabled sessions are revoked');
  assert.equal((await auth('patch', `/admin/users/${userIds.other}/status`, 'admin').send({ isDisabled: false })).status, 200);
  assert.equal((await auth('get', '/auth/me', 'other')).status, 401, 'unblocking must not revive old tokens');
  assert.equal((await auth('delete', `/admin/users/${userIds.student}`, 'admin')).status, 409);
  assert.equal((await auth('delete', '/admin/courses/1', 'admin')).status, 409);
  assert.equal((await auth('delete', '/admin/categories/1', 'admin')).status, 409);
  const category = await auth('post', '/admin/categories', 'admin').send({ name: 'Disposable' });
  assert.equal(category.status, 201, JSON.stringify(category.body));
  const id = category.body.data.id;
  assert.equal((await auth('patch', `/admin/categories/${id}`, 'admin').send({ name: 'Renamed' })).status, 200);
  assert.equal((await auth('delete', `/admin/categories/${id}`, 'admin')).status, 204);
  assert.equal((await auth('patch', `/admin/categories/${id}`, 'admin').send({ name: 'Missing' })).status, 404);
  assert.equal((await auth('patch', '/admin/courses/2/status', 'admin').send({ isDisabled: true })).status, 200);
  assert.equal((await request(app).get(`${api}/courses/2`)).status, 404);
  assert.equal((await auth('patch', '/admin/courses/2/status', 'admin').send({ isDisabled: false })).status, 200);
});

test('CORS preflight and origin checks protect credentialed requests', async () => {
  const allowed = env.allowedOrigins[0];
  const preflight = await request(app).options(`${api}/me/profile`).set('Origin', allowed).set('Access-Control-Request-Method', 'PATCH');
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers['access-control-allow-origin'], allowed);
  assert.equal((await request(app).post(`${api}/auth/login`).set('Origin', 'https://evil.example').send({ username: 'student', password: 'password123' })).status, 403);
});
