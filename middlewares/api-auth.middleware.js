import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import { findUserById, toSessionUser } from '../services/account.service.js';

export async function requireApiUser(req, res, next) {
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
    return next();
  } catch (error) {
    return next(error);
  }
}
