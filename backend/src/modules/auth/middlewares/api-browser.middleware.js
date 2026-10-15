import { env } from '../../../config/env.js';
import { AppError, ForbiddenError } from '../../../common/errors/app-error.js';
import { validCsrf } from '../services/token.service.js';

export function refreshCookie(req) {
  const value = (req.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith('academy.refresh='));
  return value?.slice('academy.refresh='.length) || null;
}
export function apiCors(req, res, next) {
  const origin = req.get('origin');
  res.vary('Origin');
  if (origin && !env.allowedOrigins.includes(origin)) return next(new ForbiddenError('Origin không được phép.'));
  if (origin) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-CSRF-Token');
    return res.sendStatus(204);
  }
  return next();
}
export function authJsonRequest(req, res, next) {
  if (req.get('sec-fetch-site') === 'cross-site' && !env.allowedOrigins.includes(req.get('origin'))) return next(new ForbiddenError());
  if (!req.is('application/json')) return next(new AppError('Request phải dùng application/json.', 415, 'UNSUPPORTED_MEDIA_TYPE'));
  return next();
}
export function refreshCsrf(req, res, next) {
  if (!validCsrf(refreshCookie(req), req.get('x-csrf-token'))) return next(new AppError('CSRF token không hợp lệ.', 403, 'CSRF_TOKEN_INVALID'));
  return next();
}
