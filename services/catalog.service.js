import CategoryDao from '../daos/category.dao.js';
import CourseDao from '../daos/course.dao.js';
import FeedbackDao from '../daos/feedback.dao.js';
import { NotFoundError } from '../errors/app-error.js';
import { apiPagination, pagination, positiveInteger } from '../validators/common.schema.js';
import { courseApiQuerySchema, searchSchema } from '../validators/course.schema.js';

export async function listCourses(query) {
  const pageInfo = pagination(query, 9);
  const [courses, totalCourses] = await Promise.all([CourseDao.findPageAll(pageInfo.limit, pageInfo.offset), CourseDao.countAll()]);
  return { courses, ...pageInfo, totalPages: Math.ceil(totalCourses / pageInfo.limit) };
}

export async function listCoursesForApi(query) {
  const filters = courseApiQuerySchema(query);
  const [courses, totalCourses] = filters.q
    ? await Promise.all([CourseDao.findPageByFTS(filters.q, filters.sort, filters.limit, filters.offset, filters.categoryId), CourseDao.countByFTS(filters.q, filters.categoryId)])
    : await Promise.all([CourseDao.findPageAllForApi(filters), CourseDao.countAllForApi(filters)]);
  return { courses, totalCourses: Number(totalCourses), ...filters, totalPages: Math.ceil(totalCourses / filters.limit) };
}

export async function listCategories() {
  return CategoryDao.all();
}

export async function getCourseDetail(rawId) {
  const courseId = positiveInteger(rawId, 'Khóa học');
  const course = await CourseDao.findById(courseId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  await CourseDao.incrementViewCount(courseId);
  return { course, feedbacks: await FeedbackDao.findByCourse(courseId) };
}

export async function listByCategory(rawId, query) {
  const categoryId = positiveInteger(rawId, 'Lĩnh vực');
  const category = await CategoryDao.findById(categoryId);
  if (!category) throw new NotFoundError('Không tìm thấy lĩnh vực.');
  const ids = [categoryId, ...await CategoryDao.findChildIds(categoryId)];
  const pageInfo = pagination(query, 9);
  const [courses, totalCourses] = await Promise.all([CourseDao.findPageByCategoryIds(ids, pageInfo.limit, pageInfo.offset), CourseDao.countByCategoryIds(ids)]);
  return { category, courses, ...pageInfo, totalPages: Math.ceil(totalCourses / pageInfo.limit) };
}

export async function listByCategoryForApi(rawId, query) {
  const categoryId = positiveInteger(rawId, 'Lĩnh vực');
  const category = await CategoryDao.findById(categoryId);
  if (!category) throw new NotFoundError('Không tìm thấy lĩnh vực.');
  const ids = [categoryId, ...await CategoryDao.findChildIds(categoryId)];
  const pageInfo = apiPagination(query, 12, 50);
  const [courses, totalCourses] = await Promise.all([CourseDao.findPageByCategoryIds(ids, pageInfo.limit, pageInfo.offset), CourseDao.countByCategoryIds(ids)]);
  return { category, courses, totalCourses: Number(totalCourses), ...pageInfo, totalPages: Math.ceil(totalCourses / pageInfo.limit) };
}

export async function searchCourses(query) {
  const filters = searchSchema(query);
  const [courses, totalCourses] = await Promise.all([CourseDao.findPageByFTS(filters.q, filters.sort, filters.limit, filters.offset), CourseDao.countByFTS(filters.q)]);
  return { ...filters, courses, totalPages: Math.ceil(totalCourses / filters.limit), queryString: new URLSearchParams({ q: filters.q, sort: filters.sort }).toString() };
}

export async function homeCatalog() {
  const [outstandingCourses, mostViewedCourses, newestCourses, topCategories] = await Promise.all([
    CourseDao.findOutstandingPastWeek(), CourseDao.findMostViewed(10), CourseDao.findNewest(10), CategoryDao.findMostEnrolledPastWeek(5),
  ]);
  return { outstandingCourses, mostViewedCourses, newestCourses, topCategories };
}
