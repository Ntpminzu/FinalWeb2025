import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApiClient, ApiError } from '../src/lib/http.js';
import { readGuestIds, writeGuestIds, checkoutAttempt } from '../src/features/cart/storage.js';
import { safeReturnTo } from '../src/lib/format.js';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('concurrent expired requests share one refresh and use the rotated token', async () => {
  let refreshes = 0;
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      if (url.endsWith('/auth/login'))
        return json({ data: { accessToken: 'expired', user: { id: 1 } } });
      if (url.endsWith('/auth/csrf-token')) return json({ data: { csrfToken: 'csrf' } });
      if (url.endsWith('/auth/refresh')) {
        refreshes++;
        assert.equal(options.headers.get('X-CSRF-Token'), 'csrf');
        await new Promise((resolve) => setTimeout(resolve, 5));
        return json({ data: { accessToken: 'fresh' } });
      }
      if (options.headers.get('Authorization') === 'Bearer fresh')
        return json({ data: url.endsWith('/auth/me') ? { id: 1 } : ['ok'] });
      return json({ error: { message: 'expired', code: 'UNAUTHORIZED' } }, 401);
    },
  });
  await client.login({ username: 'student', password: 'password' });
  const results = await Promise.all([
    client.request('/cart'),
    client.request('/me/courses'),
    client.request('/me/watchlist'),
  ]);
  assert.equal(refreshes, 1);
  assert.deepEqual(
    results.map((result) => result.data),
    [['ok'], ['ok'], ['ok']],
  );
  assert.ok(calls.every(([, options]) => options.credentials === 'include'));
});

test('public login errors do not refresh; invalid sessions stop after one attempt', async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.endsWith('/auth/csrf-token')) return json({ data: { csrfToken: 'csrf' } });
      return json({ error: { message: 'Sai tài khoản', code: 'UNAUTHORIZED' } }, 401);
    },
  });
  await assert.rejects(client.login({}), (error) => error.status === 401);
  assert.equal(calls.length, 1);
  await assert.rejects(client.request('/cart'), (error) => error.status === 401);
  assert.equal(calls.filter((url) => url.endsWith('/auth/refresh')).length, 1);
  assert.equal(client.getSession().user, null);
});

test('204, multipart, abort and network/server failures retain their meaning', async () => {
  const payload = new FormData();
  payload.set('title', 'React');
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      if (url === '/api/v1/upload') {
        assert.equal(options.body, payload);
        assert.equal(options.headers.has('Content-Type'), false);
        return json({ data: { id: 1 } });
      }
      if (url.endsWith('/empty')) return new Response(null, { status: 204 });
      if (url.endsWith('/network')) throw new TypeError('fetch failed');
      if (url.endsWith('/abort')) throw new DOMException('cancelled', 'AbortError');
      if (url.endsWith('/conflict'))
        return json({ error: { message: 'Đã mua', code: 'CONFLICT' } }, 409);
      return new Response('<html>wrong proxy</html>');
    },
  });
  assert.equal(await client.request('/empty', { auth: false }), null);
  await client.request('/upload', { method: 'POST', body: payload, auth: false });
  await assert.rejects(
    client.request('/network', { auth: false }),
    (error) => error instanceof ApiError && error.status === 0,
  );
  await assert.rejects(
    client.request('/abort', { auth: false }),
    (error) => error.name === 'AbortError',
  );
  await assert.rejects(
    client.request('/conflict', { auth: false }),
    (error) => error.status === 409 && error.message === 'Đã mua',
  );
  await assert.rejects(
    client.request('/invalid', { auth: false }),
    (error) => error.code === 'INVALID_RESPONSE',
  );
});

test('logout can refresh an expired token; network failure does not fake successful logout', async () => {
  let outage = true;
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      if (url.endsWith('/auth/login'))
        return json({ data: { accessToken: 'old', user: { id: 1 } } });
      if (url.endsWith('/auth/csrf-token')) return json({ data: { csrfToken: 'csrf' } });
      if (url.endsWith('/auth/refresh')) return json({ data: { accessToken: 'new' } });
      if (url.endsWith('/auth/me')) return json({ data: { id: 1 } });
      if (outage) throw new TypeError('offline');
      return options.headers.get('Authorization') === 'Bearer new'
        ? new Response(null, { status: 204 })
        : json({ error: { message: 'expired' } }, 401);
    },
  });
  await client.login({});
  await assert.rejects(client.logout());
  assert.equal(client.getSession().user.id, 1);
  outage = false;
  await client.logout();
  assert.equal(client.getSession().user, null);
});

test('guest cart stores only valid unique IDs and checkout reuses its key for the same snapshot', () => {
  const storage = memoryStorage();
  storage.setItem('academy.guest-cart', '[1,1,-1,"2",null,3,2147483648]');
  assert.deepEqual(readGuestIds(storage), [1, 3]);
  writeGuestIds([3, 4, 4], storage);
  assert.deepEqual(readGuestIds(storage), [3, 4]);
  const first = checkoutAttempt(1, [3, 4], storage);
  assert.equal(checkoutAttempt(1, [4, 3], storage).idempotencyKey, first.idempotencyKey);
  assert.notEqual(checkoutAttempt(2, [3, 4], storage).idempotencyKey, first.idempotencyKey);
  assert.notEqual(checkoutAttempt(1, [3], storage).idempotencyKey, first.idempotencyKey);
});

test('login return URLs stay inside this application', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/\n/evil.test'])
    assert.equal(safeReturnTo(value), '/');
  assert.equal(safeReturnTo('/student/courses?x=1'), '/student/courses?x=1');
});

test('an old request cannot be retried with another account credentials', async () => {
  let rejectOld;
  let account = 0;
  let refreshes = 0;
  const client = createApiClient({
    fetchImpl: async (url) => {
      if (url.endsWith('/auth/login'))
        return json({ data: { accessToken: `token-${++account}`, user: { id: account } } });
      if (url.endsWith('/cart'))
        return new Promise((resolve) => {
          rejectOld = () => resolve(json({ error: { message: 'expired' } }, 401));
        });
      refreshes++;
      throw new Error('Must not refresh under a different account');
    },
  });
  await client.login({});
  const old = client.request('/cart');
  client.clearSession();
  await client.login({});
  rejectOld();
  await assert.rejects(old, (error) => error.code === 'SESSION_CHANGED');
  assert.equal(refreshes, 0);
});
