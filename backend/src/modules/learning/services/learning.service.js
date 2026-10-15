import FeedbackRepository from '../../reviews/repositories/feedback.repository.js';
import LectureRepository from '../repositories/lecture.repository.js';
import ProgressRepository from '../repositories/progress.repository.js';
import PurchasedRepository from '../repositories/purchased.repository.js';
import Progress from '../domain/progress.model.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../common/errors/app-error.js';
import { positiveInteger } from '../../../common/schemas/common.schema.js';
import { durationSchema, progressSchema } from '../schemas/learning.schema.js';

async function requirePurchased(userId, courseId) {
  if (!await PurchasedRepository.findByUserAndCourse(userId, courseId)) throw new ForbiddenError('Bạn cần sở hữu khóa học để xem bài giảng.');
}

export async function courseLectures(userId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  await requirePurchased(userId, courseId);
  const [lectures, feedbacks, progress, completion] = await Promise.all([LectureRepository.findByCourse(courseId), FeedbackRepository.findByCourse(courseId), ProgressRepository.findByCourse(userId, courseId), ProgressRepository.courseCompletion(userId, courseId)]);
  return { courseId, lectures, feedbacks, progress, completion };
}

export async function lectureDetail(userId, rawCourseId, rawLectureId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const lectureId = positiveInteger(rawLectureId, 'Bài giảng');
  await requirePurchased(userId, courseId);
  const current = await LectureRepository.findById(lectureId);
  if (!current || Number(current.course_id) !== courseId) throw new NotFoundError('Không tìm thấy bài giảng.');
  const [lectures, progress] = await Promise.all([LectureRepository.findByCourse(courseId), ProgressRepository.find(userId, lectureId)]);
  return { courseId, lectures, current, progress: progress || { last_second: 0, watched_percent: 0, is_completed: false } };
}

export async function saveProgress(userId, input) {
  const { lectureId, lastSecond } = progressSchema(input);
  const lecture = await LectureRepository.findById(lectureId);
  if (!lecture) throw new NotFoundError('Không tìm thấy bài giảng.');
  await requirePurchased(userId, lecture.course_id);
  const duration = Number(lecture.duration_sec);
  if (!Number.isFinite(duration) || duration <= 0) throw new ConflictError('Chưa xác định thời lượng bài giảng.');
  const previous = await ProgressRepository.find(userId, lectureId);
  const safePosition = Math.min(duration, Math.max(lastSecond, Number(previous?.last_second || 0)));
  const progress = new Progress({ user_id: userId, lecture_id: lectureId });
  progress.calculateProgress(safePosition, duration);
  return ProgressRepository.upsert(userId, lectureId, { last_second: progress.last_second, watched_percent: progress.watched_percent, is_completed: progress.is_completed });
}

export async function saveDuration(userId, input) {
  return verifyDuration(userId, input?.lecture_id, { durationSec: input?.duration_sec });
}

export async function verifyDuration(userId, rawLectureId, input) {
  const { lectureId, duration } = durationSchema({ lecture_id: rawLectureId, duration_sec: input?.durationSec });
  const lecture = await LectureRepository.findById(lectureId);
  if (!lecture) throw new NotFoundError('Không tìm thấy bài giảng.');
  await requirePurchased(userId, lecture.course_id);
  if (!Number(lecture.duration_sec)) throw new ConflictError('Giảng viên cần cập nhật thời lượng bài giảng.');
  if (Number(lecture.duration_sec) !== duration) throw new ConflictError('Thời lượng khác với dữ liệu của giảng viên.');
  return { lectureId, durationSec: Number(lecture.duration_sec) };
}

export async function purchasedCourses(userId) {
  const courses = await PurchasedRepository.findAllByUser(userId);
  return Promise.all(courses.map(async course => {
    const { percent } = await ProgressRepository.courseCompletion(userId, course.course_id);
    return { ...course, completion_percent: percent, is_completed: percent >= 90 };
  }));
}

export async function ownedCourseIds(userId) {
  return (await PurchasedRepository.findOwnedCourseIds(userId)).map(String);
}
