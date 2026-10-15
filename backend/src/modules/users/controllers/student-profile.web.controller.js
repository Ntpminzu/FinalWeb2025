import { AppError } from '../../../common/errors/app-error.js';
import * as userService from '../services/user.service.js';

const profileView = (req, extra = {}) => ({ user: req.session.authUser, isAuthenticated: true, authUser: req.session.authUser, error: false, success: false, ...extra });
export function home(req, res) { return res.render('vwStudent/home', profileView(req)); }

export function showProfile(req, res) { return res.render('vwStudent/profile', profileView(req)); }

export async function updateProfile(req, res, next) {
  try {
    const data = await userService.updateProfile(req.session.authUser.id, req.body);
    Object.assign(req.session.authUser, data);
    return res.render('vwStudent/profile', profileView(req, { success: 'Cập nhật thông tin thành công!' }));
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwStudent/profile', profileView(req, { error: error.message }));
    return next(error);
  }
}

export async function changePwd(req, res, next) {
  try {
    await userService.changePassword(req.session.authUser.id, req.body);
    return res.render('vwStudent/profile', profileView(req, { success: 'Đổi mật khẩu thành công!' }));
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwStudent/profile', profileView(req, { error: error.message }));
    return next(error);
  }
}
