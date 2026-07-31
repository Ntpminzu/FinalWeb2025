import { AppError } from '../errors/app-error.js';
import * as accountService from '../services/account.service.js';
import * as studentService from '../services/student.service.js';
import { safeReferrer } from '../utils/safe-redirect.js';

const profileView = (req, extra = {}) => ({ user: req.session.authUser, isAuthenticated: true, authUser: req.session.authUser, error: false, success: false, ...extra });

export function home(req, res) { return res.render('vwStudent/home', profileView(req)); }
export function showProfile(req, res) { return res.render('vwStudent/profile', profileView(req)); }

export async function updateProfile(req, res, next) {
  try {
    const data = await accountService.updateProfile(req.session.authUser.id, req.body);
    Object.assign(req.session.authUser, data);
    return res.render('vwStudent/profile', profileView(req, { success: 'Cập nhật thông tin thành công!' }));
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwStudent/profile', profileView(req, { error: error.message }));
    return next(error);
  }
}

export async function changePwd(req, res, next) {
  try {
    await accountService.changePassword(req.session.authUser.id, req.body);
    return res.render('vwStudent/profile', profileView(req, { success: 'Đổi mật khẩu thành công!' }));
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwStudent/profile', profileView(req, { error: error.message }));
    return next(error);
  }
}

export async function showWatchlist(req, res, next) {
  try {
    const items = await studentService.listWatchlist(req.session.authUser.id);
    return res.render('vwStudent/watchlist', { ...profileView(req), items, ok: req.query.ok === '1', removed: req.query.removed === '1' });
  } catch (error) { return next(error); }
}

export async function addToWatchlist(req, res, next) {
  try {
    const courseId = await studentService.addToWatchlist(req.session.authUser.id, req.body.course_id, req.body.course_title);
    return res.redirect(safeReferrer(req, `/courses/${courseId}`));
  } catch (error) { return next(error); }
}

export async function removeFromWatchlist(req, res, next) {
  try {
    await studentService.removeFromWatchlist(req.session.authUser.id, req.body.course_id);
    return res.redirect('/student/watchlist?removed=1');
  } catch (error) { return next(error); }
}

export async function showPurchasedCourses(req, res, next) {
  try { return res.render('vwStudent/courses', { purchasedCourses: await studentService.purchasedCourses(req.session.authUser.id) }); }
  catch (error) { return next(error); }
}
