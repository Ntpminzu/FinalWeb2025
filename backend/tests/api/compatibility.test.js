import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcrypt';
import request from 'supertest';

const uploadRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'academy-api-tests-'));
process.env.UPLOAD_ROOT = uploadRoot;
const { default: app } = await import('../../src/app.js');
const { default: db } = await import('../../src/config/database.js');
const { postgres } = await import('../helpers/embedded-db.js');
const clients = { student: request.agent(app), teacher: request.agent(app), admin: request.agent(app) };
const tokens = {};
const api = '/api/v1';
const auth = (method, url, role = 'teacher') => request(app)[method](api + url).auth(tokens[role], { type: 'bearer' });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOioAAAAASUVORK5CYII=', 'base64');
const images = async () => fs.readdir(path.join(uploadRoot, 'thumbnails')).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));
const csrfFrom = response => /name="csrf-token" content="([^"]+)"/.exec(response.text)?.[1];

before(async () => {
  await db.migrate.latest();
  const password = await bcrypt.hash('password123', 4);
  for (const [role, permission] of [['student', 1], ['teacher', 2], ['admin', 3]]) {
    const [user] = await db('users').insert({ username: role, name: `Test ${role}`, email: `${role}@example.com`, password, permission }).returning('*');
    if (permission === 2) await db('instructors').insert({ user_id: user.id });
    tokens[role] = (await request(app).post(`${api}/auth/login`).send({ username: role, password: 'password123' })).body.data.accessToken;
  }
  await db('categories').insert({ id: 1, catname: 'Programming' });
  await db('courses').insert({ id: 1, title: 'Web course', instructor_id: 2, category_id: 1, price: 100 });
  await db.raw("SELECT setval(pg_get_serial_sequence('courses', 'id'), 1)");
});
after(async () => {
  await db.destroy(); await postgres.close();
  const relative = path.relative(os.tmpdir(), uploadRoot);
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
  await fs.rm(uploadRoot, { recursive: true });
});

test('multipart thumbnail upload validates content and cleans files after failed writes', async () => {
  const invalidCategory = await auth('post', '/instructor/courses').field('title', 'Bad category').field('categoryId', '999').field('price', '100').attach('thumbnail', png, { filename: 'tiny.png', contentType: 'image/png' });
  assert.equal(invalidCategory.status, 400, JSON.stringify(invalidCategory.body));
  assert.deepEqual(await images(), []);
  const forged = await auth('post', '/instructor/courses').field('title', 'Forged').field('categoryId', '1').field('price', '100').attach('thumbnail', Buffer.from('not an image'), { filename: 'fake.png', contentType: 'image/png' });
  assert.equal(forged.status, 400);
  assert.deepEqual(await images(), []);
  const oversized = await auth('post', '/instructor/courses').field('title', 'Huge').field('categoryId', '1').field('price', '100').attach('thumbnail', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'huge.png', contentType: 'image/png' });
  assert.equal(oversized.status, 400);
  assert.deepEqual(await images(), []);
  const saved = await auth('post', '/instructor/courses').field('title', 'With image').field('categoryId', '1').field('price', '100').attach('thumbnail', png, { filename: 'tiny.png', contentType: 'image/png' });
  assert.equal(saved.status, 201, JSON.stringify(saved.body));
  assert.equal((await images()).length, 1);
  assert.match(saved.body.data.thumbnail, /^\/uploads\/thumbnails\/[0-9a-f-]+\.png$/);
  const servedImage = await request(app).get(saved.body.data.thumbnail);
  assert.equal(servedImage.status, 200, 'uploaded image URL must resolve after moving the backend');
  assert.match(servedImage.headers['content-type'], /image\/png/);
  const updated = await auth('patch', `/instructor/courses/${saved.body.data.id}`).send({ title: 'Keep image' });
  assert.equal(updated.body.data.thumbnail, saved.body.data.thumbnail);
  const denied = await auth('patch', '/instructor/courses/999').attach('thumbnail', png, { filename: 'tiny.png', contentType: 'image/png' });
  assert.equal(denied.status, 404);
  assert.equal((await images()).length, 1, 'ownership check must run before saving an upload');
});

test('legacy pages render for every role and web sessions do not authorize JWT APIs', async () => {
  for (const [role, client] of Object.entries(clients)) {
    const signin = await client.get('/account/signin');
    assert.equal(signin.status, 200, signin.text.slice(0, 100));
    const csrf = csrfFrom(signin);
    assert.ok(csrf, 'rendered pages must expose a CSRF token');
    const login = await client.post('/account/signin').type('form').send({ username: role, password: 'password123', _csrf: csrf });
    assert.equal(login.status, 302, login.text);
    const target = role === 'teacher' ? '/instructor/dashboard' : role === 'admin' ? '/admin' : '/student';
    const page = await client.get(target);
    assert.equal(page.status, 200, `${target}: ${page.text.slice(0, 200)}`);
    assert.match(page.headers['content-type'], /text\/html/);
    assert.equal((await client.get(`${api}/auth/me`)).status, 401);
  }
});

test('guest session cart merges once on web login and JWT sees the same persistent cart', async () => {
  const guest = request.agent(app);
  const signin = await guest.get('/account/signin');
  const csrf = csrfFrom(signin);
  assert.equal((await guest.post('/cart/add').type('form').send({ course_id: 1, _csrf: csrf })).status, 302);
  assert.equal((await guest.post('/account/signin').type('form').send({ username: 'student', password: 'password123', _csrf: csrf })).status, 302);
  assert.equal((await auth('get', '/cart', 'student')).body.data.courses.length, 1);
  assert.equal((await guest.get('/cart')).status, 200);
  assert.equal((await guest.get('/cart')).status, 200);
  assert.equal(Number((await db('cart_items').count('* as n').first()).n), 1);
  const cartPage = await guest.get('/cart');
  const checkout = await guest.post('/cart/checkout').type('form').send({ _csrf: csrfFrom(cartPage) });
  assert.equal(checkout.status, 302, checkout.text);
  assert.equal(checkout.headers.location, '/student/courses');
  assert.equal((await auth('get', '/cart', 'student')).body.data.empty, true);
  assert.equal((await auth('get', '/me/courses', 'student')).body.data[0].courseId, 1);
});
