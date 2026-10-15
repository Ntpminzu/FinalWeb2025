import { managementCourseDto } from '../../courses/dto/course.dto.js';
import * as instructorService from '../services/instructor.service.js';
import { removeUploadedFile, validateThumbnail } from '../../../common/middlewares/upload.middleware.js';
import { created, noContent, ok } from '../../../common/utils/api-response.js';
import { lectureDto } from '../../learning/dto/learning.dto.js';
import { apiPagination } from '../../../common/schemas/common.schema.js';

export async function dashboard(req, res, next) {
  try {
    const courses = await instructorService.dashboard(req.user.id);
    return ok(res, { totalCourses: courses.length, courses: courses.map(managementCourseDto) });
  } catch (error) { return next(error); }
}
export async function list(req, res, next) {
  try {
    const result = await instructorService.coursePage(req.user.id, req.query);
    const { page, limit } = apiPagination(req.query);
    return ok(res, result.items.map(managementCourseDto), { pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) } });
  } catch (error) { return next(error); }
}
export async function detail(req, res, next) {
  try { return ok(res, managementCourseDto(await instructorService.requireOwnedCourse(req.user.id, req.params.courseId))); }
  catch (error) { return next(error); }
}
export async function ownedCourse(req, res, next) {
  try { await instructorService.requireOwnedCourse(req.user.id, req.params.courseId); return next(); }
  catch (error) { return next(error); }
}
export async function create(req, res, next) {
  try {
    await validateThumbnail(req.file);
    const course = await instructorService.createCourseForApi(req.user.id, req.body, req.file ? `/uploads/thumbnails/${req.file.filename}` : null);
    return created(res, managementCourseDto(course));
  } catch (error) { await removeUploadedFile(req.file); return next(error); }
}
export async function update(req, res, next) {
  try {
    await validateThumbnail(req.file);
    const course = await instructorService.updateCourseForApi(req.user.id, req.params.courseId, req.body, req.file ? `/uploads/thumbnails/${req.file.filename}` : null);
    return ok(res, managementCourseDto(course));
  } catch (error) { await removeUploadedFile(req.file); return next(error); }
}
export async function status(req, res, next) {
  try { return ok(res, await instructorService.setStatus(req.user.id, req.params.courseId, req.body.isCompleted)); }
  catch (error) { return next(error); }
}
export async function removeCourse(req, res, next) {
  try { await instructorService.deleteCourse(req.user.id, req.params.courseId); return noContent(res); }
  catch (error) { return next(error); }
}
export async function lectures(req, res, next) {
  try {
    const result = await instructorService.lectureManagement(req.user.id, req.params.courseId);
    return ok(res, result.lectures.map(lectureDto));
  } catch (error) { return next(error); }
}
export async function addLecture(req, res, next) {
  try { return created(res, lectureDto(await instructorService.addLectureForApi(req.user.id, req.params.courseId, req.body))); }
  catch (error) { return next(error); }
}
export async function updateLecture(req, res, next) {
  try { return ok(res, lectureDto(await instructorService.updateLectureForApi(req.user.id, req.params.lectureId, req.body))); }
  catch (error) { return next(error); }
}
export async function removeLecture(req, res, next) {
  try { await instructorService.deleteLecture(req.user.id, req.params.lectureId); return noContent(res); }
  catch (error) { return next(error); }
}
export async function profile(req, res, next) {
  try {
    const profile = await instructorService.findProfile(req.user.id);
    return ok(res, { userId: profile.user_id, name: profile.name, email: profile.email, username: profile.username, bio: profile.bio, specialization: profile.specialization, totalStudents: Number(profile.total_students), totalCourses: Number(profile.total_courses), ratingAverage: Number(profile.rating_avg) });
  }
  catch (error) { return next(error); }
}
export async function updateProfile(req, res, next) {
  try {
    const before = await instructorService.findProfile(req.user.id);
    await instructorService.updateProfile(req.user.id, { bio: before.bio, specialization: before.specialization, ...req.body });
    return profile(req, res, next);
  }
  catch (error) { return next(error); }
}
