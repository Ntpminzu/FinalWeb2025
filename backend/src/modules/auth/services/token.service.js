import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import AuthRepository from '../repositories/auth.repository.js';
import UserRepository from '../../users/repositories/user.repository.js';
import { transaction } from '../../../common/database/transaction.js';
import { ForbiddenError, UnauthorizedError } from '../../../common/errors/app-error.js';

const digest = token => crypto.createHash('sha256').update(token).digest('hex');
const freshToken = () => crypto.randomBytes(32).toString('base64url');
const active = session => session && !session.revoked_at && new Date(session.expires_at).getTime() > Date.now();

function accessToken(userId, sessionId) {
  return jwt.sign({ sid: sessionId, type: 'access' }, env.jwtSecret, {
    algorithm: 'HS256', issuer: env.jwtIssuer, audience: env.jwtAudience,
    subject: String(userId), expiresIn: env.accessTokenSeconds,
  });
}
function result(session, refreshToken) {
  return { accessToken: accessToken(session.user_id, session.id), tokenType: 'Bearer', expiresIn: env.accessTokenSeconds, refreshToken, refreshExpiresAt: session.expires_at };
}
export async function issue(userId) {
  const session = { id: crypto.randomUUID(), user_id: userId, expires_at: new Date(Date.now() + env.refreshTokenSeconds * 1000) };
  const refreshToken = freshToken();
  await transaction(connection => AuthRepository.createSession(session, digest(refreshToken), connection));
  return result(session, refreshToken);
}
export async function authenticate(token) {
  let claims;
  try {
    claims = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'], issuer: env.jwtIssuer, audience: env.jwtAudience });
    if (claims.type !== 'access' || !/^[1-9]\d*$/.test(claims.sub) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.sid || '')) throw new Error('Invalid claims');
  } catch {
    throw new UnauthorizedError('Access token không hợp lệ hoặc đã hết hạn.');
  }
  const session = await AuthRepository.findSession(claims.sid);
  if (!active(session) || Number(session.user_id) !== Number(claims.sub)) throw new UnauthorizedError('Phiên đăng nhập đã hết hạn hoặc bị thu hồi.');
  const user = await UserRepository.findById(Number(claims.sub));
  if (!user || user.is_disabled) {
    await AuthRepository.revoke(session.id);
    throw new ForbiddenError('Tài khoản đã bị khóa hoặc không còn tồn tại.');
  }
  return { user, sessionId: session.id };
}
export async function refresh(rawToken) {
  if (typeof rawToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(rawToken)) throw new UnauthorizedError('Refresh token không hợp lệ.');
  const hash = digest(rawToken);
  const outcome = await transaction(async connection => {
    const first = await AuthRepository.findToken(hash, connection);
    if (!first) return null;
    const session = await AuthRepository.findSession(first.session_id, connection, true);
    if (!active(session)) return null;
    const stored = await AuthRepository.findToken(hash, connection);
    if (stored.used_at) {
      await AuthRepository.revoke(session.id, connection);
      return null; // Commit revocation before reporting replay to the caller.
    }
    const user = await UserRepository.findById(session.user_id, connection);
    if (!user || user.is_disabled) {
      await AuthRepository.revoke(session.id, connection);
      return null;
    }
    const next = freshToken();
    await AuthRepository.useToken(hash, connection);
    await AuthRepository.addToken(session.id, digest(next), connection);
    return { session, next };
  });
  if (!outcome) throw new UnauthorizedError('Refresh token hết hạn, đã sử dụng hoặc bị thu hồi.');
  return result(outcome.session, outcome.next);
}
export const logout = sessionId => AuthRepository.revoke(sessionId);
export const csrfToken = refreshToken => refreshToken
  ? crypto.createHmac('sha256', env.jwtSecret).update(`csrf:${refreshToken}`).digest('base64url') : null;
export function validCsrf(refreshToken, supplied) {
  const expected = Buffer.from(csrfToken(refreshToken) || '');
  const actual = Buffer.from(String(supplied || ''));
  return expected.length > 0 && actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
