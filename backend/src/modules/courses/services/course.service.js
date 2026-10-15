import CourseRepository from '../repositories/course.repository.js';
import FeedbackRepository from '../../reviews/repositories/feedback.repository.js';
import { NotFoundError } from '../../../common/errors/app-error.js';
import { pagination, positiveInteger } from '../../../common/schemas/common.schema.js';
import { courseApiQuerySchema, searchSchema } from '../schemas/course.schema.js';

export async function listCourses(query) {
  const pageInfo = pagination(query, 9);
  const [courses, totalCourses] = await Promise.all([CourseRepository.findPageAll(pageInfo.limit, pageInfo.offset), CourseRepository.countAll()]);
  return { courses, ...pageInfo, totalPages: Math.ceil(totalCourses / pageInfo.limit) };
}

export async function listCoursesForApi(query) {
  const filters = courseApiQuerySchema(query);
  const [courses, totalCourses] = filters.q
    ? await Promise.all([CourseRepository.findPageByFTS(filters.q, filters.sort, filters.limit, filters.offset, filters.categoryId), CourseRepository.countByFTS(filters.q, filters.categoryId)])
    : await Promise.all([CourseRepository.findPageAllForApi(filters), CourseRepository.countAllForApi(filters)]);
  return { courses, totalCourses: Number(totalCourses), ...filters, totalPages: Math.ceil(totalCourses / filters.limit) };
}

export async function getCourseDetail(rawId) {
  const courseId = positiveInteger(rawId, 'Khóa học');
  const course = await CourseRepository.findById(courseId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  await CourseRepository.incrementViewCount(courseId);
  return { course, feedbacks: await FeedbackRepository.findByCourse(courseId) };
}

export async function searchCourses(query) {
  const filters = searchSchema(query);
  const [courses, totalCourses] = await Promise.all([CourseRepository.findPageByFTS(filters.q, filters.sort, filters.limit, filters.offset), CourseRepository.countByFTS(filters.q)]);
  return { ...filters, courses, totalPages: Math.ceil(totalCourses / filters.limit), queryString: new URLSearchParams({ q: filters.q, sort: filters.sort }).toString() };
}
