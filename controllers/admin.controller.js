import { AppError } from '../errors/app-error.js';
import * as accountService from '../services/account.service.js';
import * as adminService from '../services/admin.service.js';

const profileData = (req, extra = {}) => ({ user: req.session.authUser, isAuthenticated: true, error: false, success: false, ...extra });

export async function dashboard(req, res, next) {
  try { return res.render('vwAdmin/home', { ...await adminService.dashboard(), user: req.session.authUser, isAuthenticated: true }); }
  catch (error) { return next(error); }
}

export async function listUsers(req, res, next) {
  try { return res.render('vwAdmin/users', await adminService.users()); }
  catch (error) { return next(error); }
}

export async function makeTeacher(req, res, next) {
  try { await adminService.promoteUser(req.params.id); return res.redirect('/admin/users'); }
  catch (error) { return next(error); }
}

export async function disableUser(req, res, next) {
  try { await adminService.setUserDisabled(req.session.authUser.id, req.params.id, req.body.disable === 'true'); return res.redirect('/admin/users'); }
  catch (error) { return next(error); }
}

export async function deleteUser(req, res, next) {
  try { await adminService.deleteUser(req.session.authUser.id, req.params.id); return res.redirect('/admin/users'); }
  catch (error) { return next(error); }
}

export async function listCourses(req, res, next) {
  try { return res.render('vwAdmin/courses', await adminService.courses()); }
  catch (error) { return next(error); }
}

export async function deleteCourse(req, res, next) {
  try { await adminService.deleteCourse(req.params.id); return res.redirect('/admin/courses'); }
  catch (error) { return next(error); }
}

export async function disableCourse(req, res, next) {
  try { await adminService.setCourseDisabled(req.params.id, req.body.disable === 'true'); return res.redirect('/admin/courses'); }
  catch (error) { return next(error); }
}

export async function listCategories(req, res, next) {
  try { return res.render('vwAdmin/categories', { categories: await adminService.categories() }); }
  catch (error) { return next(error); }
}

export async function addCategory(req, res, next) {
  try { await adminService.addCategory(req.body); return res.redirect('/admin/categories'); }
  catch (error) { return next(error); }
}

export async function editCategory(req, res, next) {
  try { await adminService.editCategory(req.body); return res.redirect('/admin/categories'); }
  catch (error) { return next(error); }
}

export async function deleteCategory(req, res, next) {
  try { await adminService.deleteCategory(req.body.id); return res.redirect('/admin/categories'); }
  catch (error) {
    try {
      const categories = await adminService.categories();
      return res.status(error.statusCode || 400).render('vwAdmin/categories', { categories, error: error.message || 'Lỗi khi xóa lĩnh vực' });
    } catch (nestedError) { return next(nestedError); }
  }
}

export function showProfile(req, res) { return res.render('vwAdmin/profile', profileData(req)); }

export async function updateProfile(req, res, next) {
  try {
    const data = await accountService.updateProfile(req.session.authUser.id, req.body);
    Object.assign(req.session.authUser, data);
    return res.render('vwAdmin/profile', profileData(req, { success: 'Cập nhật thông tin thành công!' }));
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwAdmin/profile', profileData(req, { error: error.message }));
    return next(error);
  }
}

export async function changePwd(req, res, next) {
  try {
    await accountService.changePassword(req.session.authUser.id, req.body);
    return res.render('vwAdmin/profile', profileData(req, { success: 'Đổi mật khẩu thành công!' }));
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).render('vwAdmin/profile', profileData(req, { error: error.message }));
    return next(error);
  }
}
