import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import app from '../../app.js';

test('health endpoint returns a stable api response', async () => {
  const response = await request(app).get('/api/v1/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.data.service, 'online-academy');
  assert.ok(response.body.data.timestamp);
});

test('unknown api route returns json 404', async () => {
  const response = await request(app).get('/api/v1/not-found');

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'NOT_FOUND');
  assert.equal(response.body.error.status, 404);
});

test('protected api route returns 401 instead of redirecting', async () => {
  const response = await request(app).get('/api/v1/auth/me');

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHORIZED');
});

test('state-changing api request without csrf token returns 403 json', async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'student1', password: 'password123' });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'CSRF_TOKEN_INVALID');
});
