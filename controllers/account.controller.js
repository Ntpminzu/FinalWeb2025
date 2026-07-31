import Permission from '../enums/Permission.js';
import { AppError, ForbiddenError } from '../errors/app-error.js';
import * as accountService from '../services/account.service.js';

function regenerateSession(req) {
  return new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
}

export function showSignup(req, res) { return res.render('vwAccount/signup'); }

export async function doSignup(req, res, next) {
  try {
    await accountService.register(req.body);
    return res.redirect('/account/signin?registered=1');
  } catch (error) {
    if (error instanceof AppError || error?.code === '23505') {
      return res.status(error.statusCode || 409).render('vwAccount/signup', {
        systemError: true, message: error?.code === '23505' ? 'Tên đăng nhập hoặc email đã tồn tại.' : error.message,
        form: { username: req.body.username, name: req.body.name, email: req.body.email, dob: req.body.dob },
      });
    }
    return next(error);
  }
}

export async function checkAvailable(req, res, next) {
  try { return res.json(await accountService.isUsernameAvailable(req.query.u)); }
  catch (error) { return next(error); }
}

export function showSignin(req, res) {
  return res.render('vwAccount/signin', { error: false, success: req.query.registered === '1', disabled: req.query.disabled === '1' });
}

export async function doSignin(req, res, next) {
  try {
    const user = await accountService.authenticate(req.body);
    const retUrl = req.session.retUrl;
    await regenerateSession(req);
    req.session.isAuthenticated = true;
    req.session.authUser = accountService.toSessionUser(user);
    if (retUrl?.startsWith('/') && !retUrl.startsWith('//')) return res.redirect(retUrl);
    const destinations = { [Permission.STUDENT]: '/student', [Permission.INSTRUCTOR]: '/instructor', [Permission.ADMIN]: '/admin' };
    return res.redirect(destinations[Number(user.permission)] || '/');
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwAccount/signin', { error: true, disabled: error instanceof ForbiddenError });
    return next(error);
  }
}

export function doLogout(req, res, next) {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie('online_academy.sid');
    return res.redirect('/');
  });
}

export const doSignout = doLogout;
export function showProfile(req, res) { return res.render('vwAccount/profile', { user: req.session.authUser }); }

export async function updateProfile(req, res, next) {
  try {
    const data = await accountService.updateProfile(req.session.authUser.id, req.body);
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
    await accountService.changePassword(req.session.authUser.id, req.body, true);
    return res.redirect('/account/profile?passwordChanged=1');
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwAccount/change-pwd', { user: req.session.authUser, error: true, message: error.message });
    return next(error);
  }
}
