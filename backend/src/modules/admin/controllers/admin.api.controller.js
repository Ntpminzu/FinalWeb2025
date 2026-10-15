import * as adminService from '../services/admin.service.js';
import { created, noContent, ok } from '../../../common/utils/api-response.js';
import { apiPagination } from '../../../common/schemas/common.schema.js';
import { booleanField } from '../../../common/schemas/management.schema.js';
import { ValidationError } from '../../../common/errors/app-error.js';
import { userDto } from '../../users/dto/user.dto.js';
import { managementCourseDto } from '../../courses/dto/course.dto.js';

export async function dashboard(req, res, next) {
  try { return ok(res, await adminService.dashboard()); }
  catch (error) { return next(error); }
}
function pageResponse(req, res, result, dto) {
  const { page, limit } = apiPagination(req.query);
  return ok(res, result.items.map(dto), { pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
}
export async function users(req, res, next) {
  try { return pageResponse(req, res, await adminService.userPage(req.query), user => ({ ...userDto(user), isDisabled: Boolean(user.is_disabled) })); }
  catch (error) { return next(error); }
}
export async function promote(req, res, next) {
  try {
    if (req.body.permission !== 2) throw new ValidationError('Chỉ hỗ trợ chuyển học viên thành giảng viên (permission=2).');
    await adminService.promoteUser(req.params.userId);
    return ok(res, { userId: Number(req.params.userId), permission: 2, role: 'instructor' });
  } catch (error) { return next(error); }
}
export async function userStatus(req, res, next) {
  try {
    const disabled = booleanField(req.body.isDisabled, 'isDisabled');
    await adminService.setUserDisabled(req.user.id, req.params.userId, disabled);
    return ok(res, { userId: Number(req.params.userId), isDisabled: disabled });
  } catch (error) { return next(error); }
}
export async function removeUser(req, res, next) {
  try { await adminService.deleteUser(req.user.id, req.params.userId); return noContent(res); }
  catch (error) { return next(error); }
}
export async function courses(req, res, next) {
  try { return pageResponse(req, res, await adminService.coursePage(req.query), managementCourseDto); }
  catch (error) { return next(error); }
}
export async function courseStatus(req, res, next) {
  try {
    const disabled = booleanField(req.body.isDisabled, 'isDisabled');
    await adminService.setCourseDisabled(req.params.courseId, disabled);
    return ok(res, { courseId: Number(req.params.courseId), isDisabled: disabled });
  } catch (error) { return next(error); }
}
export async function removeCourse(req, res, next) {
  try { await adminService.deleteCourse(req.params.courseId); return noContent(res); }
  catch (error) { return next(error); }
}
export async function categories(req, res, next) {
  try { return ok(res, await adminService.categories()); }
  catch (error) { return next(error); }
}
export async function addCategory(req, res, next) {
  try {
    const row = await adminService.addCategory(req.body);
    return created(res, { id: row.id, name: row.catname, parentId: row.parent_id ?? null });
  } catch (error) { return next(error); }
}
export async function updateCategory(req, res, next) {
  try {
    await adminService.editCategory({ ...req.body, id: req.params.categoryId });
    return ok(res, { id: Number(req.params.categoryId), name: req.body.name.trim() });
  } catch (error) { return next(error); }
}
export async function removeCategory(req, res, next) {
  try { await adminService.deleteCategory(req.params.categoryId); return noContent(res); }
  catch (error) { return next(error); }
}
