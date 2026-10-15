import AdminRepository from '../repositories/admin.repository.js';
import CategoryRepository from '../../categories/repositories/category.repository.js';
import CourseRepository from '../../courses/repositories/course.repository.js';
import UserRepository from '../../users/repositories/user.repository.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../common/errors/app-error.js';
import { positiveInteger } from '../../../common/schemas/common.schema.js';
import { managementQuery } from '../../../common/schemas/management.schema.js';
import { transaction } from '../../../common/database/transaction.js';
import AuthRepository from '../../auth/repositories/auth.repository.js';

export const userPage = query => UserRepository.listPage(managementQuery(query));
export const coursePage = query => CourseRepository.managementPage(managementQuery(query));

export async function dashboard() {
  const [stats, topCategories, courseStatuses] = await Promise.all([AdminRepository.getDashboardStats(), AdminRepository.getTopCategories(), AdminRepository.getCourseStatuses()]);
  return { stats: stats ?? {}, topCategories: topCategories ?? [], courseStatuses: courseStatuses ?? [] };
}

export async function users() {
  const [teachers, students] = await Promise.all([UserRepository.findTeachers(), UserRepository.findStudents()]);
  return { teachers, students };
}

export async function promoteUser(rawId) {
  const id = positiveInteger(rawId, 'Người dùng');
  if (!await UserRepository.promoteToTeacher(id)) throw new NotFoundError('Không tìm thấy học viên.');
}

function preventSelfAction(actorId, targetId) {
  const id = positiveInteger(targetId, 'Người dùng');
  if (Number(actorId) === id) throw new ForbiddenError('Không thể thực hiện thao tác này trên tài khoản đang sử dụng.');
  return id;
}

export async function setUserDisabled(actorId, targetId, disabled) {
  const id = preventSelfAction(actorId, targetId);
  if (!await UserRepository.toggleDisable(id, Boolean(disabled))) throw new NotFoundError('Không tìm thấy người dùng.');
  if (disabled) await AuthRepository.revokeAll(id);
}

export async function deleteUser(actorId, targetId) {
  const id = preventSelfAction(actorId, targetId);
  await transaction(async connection => {
    if (!await UserRepository.lock(id, connection)) throw new NotFoundError('Không tìm thấy người dùng.');
    if (await UserRepository.dependencies(id, connection)) throw new ConflictError('Không thể xóa tài khoản có khóa học hoặc lịch sử mua hàng.');
    await UserRepository.deleteById(id, connection);
  });
}

export async function courses() {
  const [courses, categories] = await Promise.all([CourseRepository.getAllWithCategoryAndTeacher(), CategoryRepository.getAllWithCourseCount()]);
  return { courses, categories };
}

export async function deleteCourse(rawId) {
  const id = positiveInteger(rawId, 'Khóa học');
  await transaction(async connection => {
    if (!await CourseRepository.lock(id, connection)) throw new NotFoundError('Không tìm thấy khóa học.');
    if (await CourseRepository.purchaseCount(id, connection)) throw new ConflictError('Không thể xóa khóa học đã có học viên mua.');
    await CourseRepository.deleteById(id, connection);
  });
}

export async function setCourseDisabled(rawId, disabled) {
  const id = positiveInteger(rawId, 'Khóa học');
  if (!await CourseRepository.toggleDisable(id, Boolean(disabled))) throw new NotFoundError('Không tìm thấy khóa học.');
}

export const categories = () => CategoryRepository.getAllWithCourseCount();

function categoryName(value) {
  const name = String(value || '').trim();
  if (!name || name.length > 100) throw new ValidationError('Tên lĩnh vực không hợp lệ.');
  return name;
}

export const addCategory = input => CategoryRepository.add({ name: categoryName(input?.name) });
export async function editCategory(input) {
  const id = positiveInteger(input?.id, 'Lĩnh vực');
  if (!await CategoryRepository.patch(id, { name: categoryName(input?.name) })) throw new NotFoundError('Không tìm thấy lĩnh vực.');
}
export async function deleteCategory(rawId) {
  const id = positiveInteger(rawId, 'Lĩnh vực');
  await transaction(async connection => {
    if (!await CategoryRepository.lock(id, connection)) throw new NotFoundError('Không tìm thấy lĩnh vực.');
    if (await CategoryRepository.dependencies(id, connection)) throw new ConflictError('Lĩnh vực còn khóa học hoặc danh mục con.');
    await CategoryRepository.remove(id, connection);
  });
}
