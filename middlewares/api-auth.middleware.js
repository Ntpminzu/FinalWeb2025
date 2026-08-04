import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import Permission from '../enums/Permission.js';
import { findUserById, toSessionUser } from '../services/account.service.js';

async function requireApiRole(req, res, next, permission = null) {
  try {
    const userId = req.session?.authUser?.id;
    if (!req.session?.isAuthenticated || !userId) {
      throw new UnauthorizedError('Bạn cần đăng nhập để tiếp tục.');
    }

    const user = await findUserById(userId);
    if (!user || user.is_disabled) {
      req.session.destroy(() => {});
      throw new ForbiddenError('Tài khoản đã bị khóa hoặc không còn tồn tại.');
    }

    req.session.authUser = toSessionUser(user);
    req.user = req.session.authUser;
    if (permission !== null && Number(req.user.permission) !== permission) {
      throw new ForbiddenError('Bạn không có quyền truy cập chức năng này.');
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireApiUser(req, res, next) {
  return requireApiRole(req, res, next);
}

export function requireApiStudent(req, res, next) {
  return requireApiRole(req, res, next, Permission.STUDENT);
}

export function requireApiInstructor(req, res, next) {
  return requireApiRole(req, res, next, Permission.INSTRUCTOR);
}

export function requireApiAdmin(req, res, next) {
  return requireApiRole(req, res, next, Permission.ADMIN);
}
