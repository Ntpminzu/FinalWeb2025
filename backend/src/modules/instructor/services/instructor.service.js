import CategoryRepository from '../../categories/repositories/category.repository.js';
import CourseRepository from '../../courses/repositories/course.repository.js';
import InstructorRepository from '../repositories/instructor.repository.js';
import LectureRepository from '../../learning/repositories/lecture.repository.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../common/errors/app-error.js';
import { positiveInteger } from '../../../common/schemas/common.schema.js';
import { courseMutationSchema } from '../../courses/schemas/course.schema.js';
import { lectureSchema } from '../../learning/schemas/learning.schema.js';
import { booleanField, managementQuery } from '../../../common/schemas/management.schema.js';
import { courseApiInput } from '../../courses/schemas/course.schema.js';
import { lectureApiInput } from '../../learning/schemas/learning.schema.js';
import { transaction } from '../../../common/database/transaction.js';

export const coursePage = (instructorId, query) => CourseRepository.managementPage(managementQuery(query), instructorId);

export async function createCourseForApi(instructorId, input, thumbnail) {
  return createCourse(instructorId, courseApiInput(input), thumbnail);
}
export async function updateCourseForApi(instructorId, id, input, thumbnail) {
  const course = await requireOwnedCourse(instructorId, id);
  await updateCourse(instructorId, id, { ...course, ...courseApiInput(input) }, thumbnail);
  return requireOwnedCourse(instructorId, id);
}
export async function setStatus(instructorId, rawId, value) {
  const isCompleted = booleanField(value, 'isCompleted');
  const course = await requireOwnedCourse(instructorId, rawId);
  if (isCompleted && await InstructorRepository.countLectures(course.id, instructorId) === 0) throw new ValidationError('Khóa học cần ít nhất một bài giảng trước khi đánh dấu hoàn thành.');
  await CourseRepository.toggleStatus(course.id, isCompleted, instructorId);
  return { courseId: course.id, isCompleted };
}
export async function addLectureForApi(instructorId, rawId, input) {
  const course = await requireOwnedCourse(instructorId, rawId);
  const data = lectureApiInput(input);
  const validated = lectureSchema(data);
  return InstructorRepository.addLecture(course.id, instructorId, validated.title, validated.video_url, data.duration_sec);
}
export async function updateLectureForApi(instructorId, rawId, input) {
  const id = positiveInteger(rawId, 'Bài giảng');
  const lecture = await LectureRepository.findById(id);
  if (!lecture) throw new NotFoundError('Không tìm thấy bài giảng.');
  await requireOwnedCourse(instructorId, lecture.course_id);
  const data = lectureApiInput({ title: lecture.title, videoUrl: lecture.video_url, durationSec: lecture.duration_sec, ...input });
  const validated = lectureSchema(data);
  const [updated] = await LectureRepository.update(id, { ...validated, duration_sec: data.duration_sec });
  return updated;
}
export async function deleteCourse(instructorId, rawId) {
  const id = positiveInteger(rawId, 'Khóa học');
  await transaction(async connection => {
    const course = await CourseRepository.lock(id, connection);
    if (!course || Number(course.instructor_id) !== Number(instructorId)) throw new NotFoundError('Không tìm thấy khóa học.');
    if (await CourseRepository.purchaseCount(id, connection)) throw new ConflictError('Không thể xóa khóa học đã có học viên mua.');
    await CourseRepository.deleteById(id, connection);
  });
}

export const categories = () => InstructorRepository.getAllCategories();
export const dashboard = async instructorId => (await InstructorRepository.getCoursesByInstructor(instructorId)).map(course => ({ ...course, status: course.Status ? 'Đã hoàn thành' : 'Chưa hoàn thành' }));

export async function requireOwnedCourse(instructorId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const course = await InstructorRepository.getCourseById(courseId, instructorId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  return course;
}

async function validateCategory(categoryId) {
  if (!await CategoryRepository.findById(categoryId)) throw new ValidationError('Lĩnh vực không tồn tại.');
}

export async function createCourse(instructorId, input, thumbnail = null) {
  const data = courseMutationSchema(input);
  await validateCategory(data.category_id);
  return InstructorRepository.addCourse({ ...data, instructor_id: instructorId, thumbnail });
}

export async function editCourseContext(instructorId, rawCourseId, ownedCourse = null) {
  const course = ownedCourse || await requireOwnedCourse(instructorId, rawCourseId);
  const [lectures, allCategories] = await Promise.all([InstructorRepository.getLecturesByCourse(course.id), categories()]);
  return { course, lectures, categories: allCategories };
}

export async function updateCourse(instructorId, rawCourseId, input, thumbnail = null) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const data = courseMutationSchema(input);
  await validateCategory(data.category_id);
  const updated = await InstructorRepository.updateCourse(courseId, instructorId, { ...data, thumbnail });
  if (!updated) throw new NotFoundError('Không tìm thấy khóa học.');
}

export async function lectureManagement(instructorId, rawCourseId) {
  const course = await requireOwnedCourse(instructorId, rawCourseId);
  return { course, lectures: await InstructorRepository.getLecturesByCourse(course.id) };
}

export async function addLecture(instructorId, rawCourseId, input) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const data = lectureSchema(input);
  const lecture = await InstructorRepository.addLecture(courseId, instructorId, data.title, data.video_url, data.duration_sec ?? null);
  if (!lecture) throw new NotFoundError('Không tìm thấy khóa học.');
  return courseId;
}

export async function deleteLecture(instructorId, rawLectureId) {
  const lectureId = positiveInteger(rawLectureId, 'Bài giảng');
  if (!await InstructorRepository.deleteLecture(lectureId, instructorId)) throw new NotFoundError('Không tìm thấy bài giảng.');
}

export async function profile(instructorId) {
  const [instructor, courses] = await Promise.all([InstructorRepository.findById(instructorId), dashboard(instructorId)]);
  return { instructor, courses };
}

export async function findProfile(instructorId) {
  const [profile, students, courses, rating] = await Promise.all([InstructorRepository.findById(instructorId), InstructorRepository.countStudent(instructorId), InstructorRepository.countCourse(instructorId), InstructorRepository.avgRating(instructorId)]);
  if (!profile) throw new NotFoundError('Không tìm thấy hồ sơ giảng viên.');
  return { ...profile, total_students: students, total_courses: courses, rating_avg: rating };
}

export async function updateProfile(instructorId, input) {
  const bio = String(input?.bio || '').trim().slice(0, 5000);
  const specialization = String(input?.specialization || '').trim().slice(0, 200);
  if (!await InstructorRepository.update(instructorId, { bio, specialization })) throw new NotFoundError('Không tìm thấy hồ sơ giảng viên.');
}

export async function toggleStatus(instructorId, rawCourseId) {
  const course = await requireOwnedCourse(instructorId, rawCourseId);
  const newStatus = !course.Status;
  if (newStatus && await InstructorRepository.countLectures(course.id, instructorId) === 0) throw new ValidationError('Khóa học cần có ít nhất một bài giảng trước khi xuất bản.');
  await CourseRepository.toggleStatus(course.id, newStatus, instructorId);
}
