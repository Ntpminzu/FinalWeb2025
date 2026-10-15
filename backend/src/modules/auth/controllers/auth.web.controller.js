import Permission from '../../../common/enums/Permission.js';
import { AppError, ForbiddenError } from '../../../common/errors/app-error.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../../users/services/user.service.js';
import { mergeLegacyCart } from '../../cart/services/cart.service.js';

function regenerateSession(req) {
  return new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
}

export function showSignup(req, res) { return res.render('vwAccount/signup'); }

export async function doSignup(req, res, next) {
  try {
    await authService.register(req.body);
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
  try { return res.json(await authService.isUsernameAvailable(req.query.u)); }
  catch (error) { return next(error); }
}

export function showSignin(req, res) {
  return res.render('vwAccount/signin', { error: false, success: req.query.registered === '1', disabled: req.query.disabled === '1' });
}

export async function doSignin(req, res, next) {
  try {
    const user = await authService.authenticate(req.body);
    const retUrl = req.session.retUrl;
    if (Number(user.permission) === Permission.STUDENT) await mergeLegacyCart(user.id, req.session.cart);
    await regenerateSession(req);
    req.session.isAuthenticated = true;
    req.session.authUser = userService.toSessionUser(user);
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
