import { AppError } from '../../../common/errors/app-error.js';
import * as userService from '../services/user.service.js';

export function showProfile(req, res) { return res.render('vwAccount/profile', { user: req.session.authUser }); }

export async function updateProfile(req, res, next) {
  try {
    const data = await userService.updateProfile(req.session.authUser.id, req.body);
    req.session.authUser = { ...req.session.authUser, ...data };
    return res.render('vwAccount/profile', { user: req.session.authUser, success: 'Cập nhật thành công.' });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwAccount/profile', { user: req.session.authUser, error: error.message });
    return next(error);
  }
}

export function showChangePwd(req, res) { return res.render('vwAccount/change-pwd', { user: req.session.authUser }); }

export async function doChangePwd(req, res, next) {
  try {
    await userService.changePassword(req.session.authUser.id, req.body, true);
    return res.redirect('/account/profile?passwordChanged=1');
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwAccount/change-pwd', { user: req.session.authUser, error: true, message: error.message });
    return next(error);
  }
}
