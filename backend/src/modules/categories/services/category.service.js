import CategoryRepository from '../repositories/category.repository.js';
import CourseRepository from '../../courses/repositories/course.repository.js';
import { NotFoundError } from '../../../common/errors/app-error.js';
import { apiPagination, pagination, positiveInteger } from '../../../common/schemas/common.schema.js';

export async function listCategories() {
  return CategoryRepository.all();
}

export async function listByCategory(rawId, query) {
  const categoryId = positiveInteger(rawId, 'Lĩnh vực');
  const category = await CategoryRepository.findById(categoryId);
  if (!category) throw new NotFoundError('Không tìm thấy lĩnh vực.');
  const ids = [categoryId, ...await CategoryRepository.findChildIds(categoryId)];
  const pageInfo = pagination(query, 9);
  const [courses, totalCourses] = await Promise.all([CourseRepository.findPageByCategoryIds(ids, pageInfo.limit, pageInfo.offset), CourseRepository.countByCategoryIds(ids)]);
  return { category, courses, ...pageInfo, totalPages: Math.ceil(totalCourses / pageInfo.limit) };
}

export async function listByCategoryForApi(rawId, query) {
  const categoryId = positiveInteger(rawId, 'Lĩnh vực');
  const category = await CategoryRepository.findById(categoryId);
  if (!category) throw new NotFoundError('Không tìm thấy lĩnh vực.');
  const ids = [categoryId, ...await CategoryRepository.findChildIds(categoryId)];
  const pageInfo = apiPagination(query, 12, 50);
  const [courses, totalCourses] = await Promise.all([CourseRepository.findPageByCategoryIds(ids, pageInfo.limit, pageInfo.offset), CourseRepository.countByCategoryIds(ids)]);
  return { category, courses, totalCourses: Number(totalCourses), ...pageInfo, totalPages: Math.ceil(totalCourses / pageInfo.limit) };
}
