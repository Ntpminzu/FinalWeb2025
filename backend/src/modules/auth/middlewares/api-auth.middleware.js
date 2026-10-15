import { ForbiddenError, UnauthorizedError } from '../../../common/errors/app-error.js';
import Permission from '../../../common/enums/Permission.js';
import * as tokenService from '../services/token.service.js';
import { toSessionUser } from '../../users/services/user.service.js';

async function requireApiRole(req, res, next, permission = null) {
  try {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') || '');
    if (!match) throw new UnauthorizedError('Bạn cần đăng nhập bằng Bearer token.');
    const { user, sessionId } = await tokenService.authenticate(match[1]);
    req.user = toSessionUser(user);
    req.authSessionId = sessionId;
    if (permission !== null && Number(req.user.permission) !== permission) throw new ForbiddenError();
    return next();
  } catch (error) { return next(error); }
}
export const requireApiUser = (req, res, next) => requireApiRole(req, res, next);
export const requireApiStudent = (req, res, next) => requireApiRole(req, res, next, Permission.STUDENT);
export const requireApiInstructor = (req, res, next) => requireApiRole(req, res, next, Permission.INSTRUCTOR);
export const requireApiAdmin = (req, res, next) => requireApiRole(req, res, next, Permission.ADMIN);

// A supplied credential must be verified, never silently downgraded to guest.
export const optionalApiUser = (req, res, next) =>
  req.get('authorization') === undefined ? next() : requireApiRole(req, res, next);
