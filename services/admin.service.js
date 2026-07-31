import AdminDao from '../daos/admin.dao.js';
import CategoryDao from '../daos/category.dao.js';
import CourseDao from '../daos/course.dao.js';
import UserDao from '../daos/user.dao.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app-error.js';
import { positiveInteger } from '../validators/common.schema.js';

export async function dashboard() {
  const [stats, topCategories, courseStatuses] = await Promise.all([AdminDao.getDashboardStats(), AdminDao.getTopCategories(), AdminDao.getCourseStatuses()]);
  return { stats: stats ?? {}, topCategories: topCategories ?? [], courseStatuses: courseStatuses ?? [] };
}

export async function users() {
  const [teachers, students] = await Promise.all([UserDao.findTeachers(), UserDao.findStudents()]);
  return { teachers, students };
}

export async function promoteUser(rawId) {
  const id = positiveInteger(rawId, 'Người dùng');
  if (!await UserDao.promoteToTeacher(id)) throw new NotFoundError('Không tìm thấy học viên.');
}

function preventSelfAction(actorId, targetId) {
  const id = positiveInteger(targetId, 'Người dùng');
  if (Number(actorId) === id) throw new ForbiddenError('Không thể thực hiện thao tác này trên tài khoản đang sử dụng.');
  return id;
}

export async function setUserDisabled(actorId, targetId, disabled) {
  const id = preventSelfAction(actorId, targetId);
  if (!await UserDao.toggleDisable(id, Boolean(disabled))) throw new NotFoundError('Không tìm thấy người dùng.');
}

export async function deleteUser(actorId, targetId) {
  const id = preventSelfAction(actorId, targetId);
  if (!await UserDao.deleteById(id)) throw new NotFoundError('Không tìm thấy người dùng.');
}

export async function courses() {
  const [courses, categories] = await Promise.all([CourseDao.getAllWithCategoryAndTeacher(), CategoryDao.getAllWithCourseCount()]);
  return { courses, categories };
}

export async function deleteCourse(rawId) {
  const id = positiveInteger(rawId, 'Khóa học');
  if (!await CourseDao.deleteById(id)) throw new NotFoundError('Không tìm thấy khóa học.');
}

export async function setCourseDisabled(rawId, disabled) {
  const id = positiveInteger(rawId, 'Khóa học');
  if (!await CourseDao.toggleDisable(id, Boolean(disabled))) throw new NotFoundError('Không tìm thấy khóa học.');
}

export const categories = () => CategoryDao.getAllWithCourseCount();

function categoryName(value) {
  const name = String(value || '').trim();
  if (!name || name.length > 100) throw new ValidationError('Tên lĩnh vực không hợp lệ.');
  return name;
}

export const addCategory = input => CategoryDao.add({ name: categoryName(input?.name) });
export const editCategory = input => CategoryDao.patch(positiveInteger(input?.id, 'Lĩnh vực'), { name: categoryName(input?.name) });
export const deleteCategory = rawId => CategoryDao.remove(positiveInteger(rawId, 'Lĩnh vực'));
