import CategoryDao from '../daos/category.dao.js';
import CourseDao from '../daos/course.dao.js';
import InstructorDao from '../daos/instructor.dao.js';
import { NotFoundError, ValidationError } from '../errors/app-error.js';
import { positiveInteger } from '../validators/common.schema.js';
import { courseMutationSchema, lectureSchema } from '../validators/course.schema.js';

export const categories = () => InstructorDao.getAllCategories();
export const dashboard = instructorId => InstructorDao.getCoursesByInstructor(instructorId);

export async function requireOwnedCourse(instructorId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const course = await InstructorDao.getCourseById(courseId, instructorId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  return course;
}

async function validateCategory(categoryId) {
  if (!await CategoryDao.findById(categoryId)) throw new ValidationError('Lĩnh vực không tồn tại.');
}

export async function createCourse(instructorId, input, thumbnail = null) {
  const data = courseMutationSchema(input);
  await validateCategory(data.category_id);
  return InstructorDao.addCourse({ ...data, instructor_id: instructorId, thumbnail });
}

export async function editCourseContext(instructorId, rawCourseId, ownedCourse = null) {
  const course = ownedCourse || await requireOwnedCourse(instructorId, rawCourseId);
  const [lectures, allCategories] = await Promise.all([InstructorDao.getLecturesByCourse(course.id), categories()]);
  return { course, lectures, categories: allCategories };
}

export async function updateCourse(instructorId, rawCourseId, input, thumbnail = null) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const data = courseMutationSchema(input);
  await validateCategory(data.category_id);
  const updated = await InstructorDao.updateCourse(courseId, instructorId, { ...data, thumbnail });
  if (!updated) throw new NotFoundError('Không tìm thấy khóa học.');
}

export async function lectureManagement(instructorId, rawCourseId) {
  const course = await requireOwnedCourse(instructorId, rawCourseId);
  return { course, lectures: await InstructorDao.getLecturesByCourse(course.id) };
}

export async function addLecture(instructorId, rawCourseId, input) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const data = lectureSchema(input);
  const lecture = await InstructorDao.addLecture(courseId, instructorId, data.title, data.video_url);
  if (!lecture) throw new NotFoundError('Không tìm thấy khóa học.');
  return courseId;
}

export async function deleteLecture(instructorId, rawLectureId) {
  const lectureId = positiveInteger(rawLectureId, 'Bài giảng');
  if (!await InstructorDao.deleteLecture(lectureId, instructorId)) throw new NotFoundError('Không tìm thấy bài giảng.');
}

export async function profile(instructorId) {
  const [instructor, courses] = await Promise.all([InstructorDao.findById(instructorId), InstructorDao.getCoursesByInstructor(instructorId)]);
  return { instructor, courses };
}

export const findProfile = instructorId => InstructorDao.findById(instructorId);

export function updateProfile(instructorId, input) {
  const bio = String(input?.bio || '').trim().slice(0, 5000);
  const specialization = String(input?.specialization || '').trim().slice(0, 200);
  return InstructorDao.update(instructorId, { bio, specialization });
}

export async function toggleStatus(instructorId, rawCourseId) {
  const course = await requireOwnedCourse(instructorId, rawCourseId);
  const newStatus = !course.Status;
  if (newStatus && await InstructorDao.countLectures(course.id, instructorId) === 0) throw new ValidationError('Khóa học cần có ít nhất một bài giảng trước khi xuất bản.');
  await CourseDao.toggleStatus(course.id, newStatus, instructorId);
}
