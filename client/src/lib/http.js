export class ApiError extends Error {
  constructor(message, status = 0, code = 'NETWORK_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// shortcut: without Web Locks, refresh is serialized within one tab; require Web Locks for concurrent tabs.
const authLock = (action) =>
  globalThis.navigator?.locks ? navigator.locks.request('online-academy-auth', action) : action();

export function createApiClient({ fetchImpl = (...args) => fetch(...args), lock = authLock } = {}) {
  let session = { user: null, accessToken: null, ready: false };
  let refreshPending;
  let revision = 0;
  const listeners = new Set();
  const setSession = (next) => {
    session = { ...session, ...next };
    listeners.forEach((listener) => listener(session));
  };
  const clearSession = () => {
    revision++;
    setSession({ user: null, accessToken: null, ready: true });
  };
  async function send(
    path,
    { body, headers, signal, keepalive = false, method = 'GET' } = {},
    token,
  ) {
    const requestHeaders = new Headers(headers);
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
    const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !multipart) requestHeaders.set('Content-Type', 'application/json');
    let response;
    try {
      response = await fetchImpl(`/api/v1${path}`, {
        method,
        signal,
        keepalive,
        credentials: 'include',
        headers: requestHeaders,
        body: body === undefined || multipart ? body : JSON.stringify(body),
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      throw new ApiError('Không kết nối được máy chủ. Kiểm tra backend và thử lại.');
    }
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok)
      throw new ApiError(
        payload?.error?.message || `Yêu cầu thất bại (${response.status}).`,
        response.status,
        payload?.error?.code || 'HTTP_ERROR',
      );
    if (response.status !== 204 && payload === null)
      throw new ApiError('Máy chủ trả dữ liệu không hợp lệ.', response.status, 'INVALID_RESPONSE');
    return payload;
  }
  function refresh() {
    if (!refreshPending) {
      const currentRevision = revision;
      refreshPending = lock(async () => {
        const csrf = (await send('/auth/csrf-token')).data.csrfToken;
        if (!csrf) {
          if (currentRevision === revision) clearSession();
          return false;
        }
        try {
          const { data } = await send('/auth/refresh', {
            method: 'POST',
            body: {},
            headers: { 'X-CSRF-Token': csrf },
          });
          const { data: user } = await send('/auth/me', {}, data.accessToken);
          if (currentRevision !== revision) return false;
          setSession({ accessToken: data.accessToken, user, ready: true });
          return true;
        } catch (error) {
          if (currentRevision === revision && [401, 403].includes(error.status)) clearSession();
          throw error;
        }
      }).finally(() => {
        refreshPending = undefined;
      });
    }
    return refreshPending;
  }
  async function request(path, { auth = true, ...options } = {}) {
    const usedToken = auth ? session.accessToken : null;
    const requestRevision = revision;
    try {
      return await send(path, options, usedToken);
    } catch (error) {
      if (!auth || error.status !== 401) throw error;
      if (requestRevision !== revision)
        throw new ApiError(
          'Phiên đăng nhập đã thay đổi. Vui lòng thử lại.',
          401,
          'SESSION_CHANGED',
        );
      if (session.accessToken === usedToken && !(await refresh())) throw error;
      // Exactly one retry; never recursively refresh a rejected request.
      return send(path, options, session.accessToken);
    }
  }
  async function bootstrap() {
    try {
      await refresh();
    } catch (error) {
      if (![401, 403].includes(error.status)) throw error;
    } finally {
      setSession({ ready: true });
    }
    return session.user;
  }
  async function authenticate(path, body) {
    return lock(async () => {
      const { data } = await send(path, { method: 'POST', body });
      revision++;
      setSession({ user: data.user, accessToken: data.accessToken, ready: true });
      return data.user;
    });
  }
  return {
    request,
    refresh,
    bootstrap,
    clearSession,
    getSession: () => session,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    login: (body) => authenticate('/auth/login', body),
    register: (body) => authenticate('/auth/register', body),
    async logout() {
      // Keep the local session on network/server failure so logout can be retried.
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch (error) {
        if (![401, 403].includes(error.status)) throw error;
      }
      clearSession();
    },
  };
}

export const api = createApiClient();
