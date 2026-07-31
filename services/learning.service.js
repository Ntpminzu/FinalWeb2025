import FeedbackDao from '../daos/feedback.dao.js';
import LectureDao from '../daos/lecture.dao.js';
import ProgressDao from '../daos/progress.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';
import Progress from '../models/progress.model.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../errors/app-error.js';
import { positiveInteger } from '../validators/common.schema.js';
import { durationSchema, progressSchema } from '../validators/course.schema.js';

async function requirePurchased(userId, courseId) {
  if (!await PurchasedDao.findByUserAndCourse(userId, courseId)) throw new ForbiddenError('Bạn cần sở hữu khóa học để xem bài giảng.');
}

export async function courseLectures(userId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  await requirePurchased(userId, courseId);
  const [lectures, feedbacks] = await Promise.all([LectureDao.findByCourse(courseId), FeedbackDao.findByCourse(courseId)]);
  return { courseId, lectures, feedbacks };
}

export async function lectureDetail(userId, rawCourseId, rawLectureId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const lectureId = positiveInteger(rawLectureId, 'Bài giảng');
  await requirePurchased(userId, courseId);
  const current = await LectureDao.findById(lectureId);
  if (!current || Number(current.course_id) !== courseId) throw new NotFoundError('Không tìm thấy bài giảng.');
  const [lectures, progress] = await Promise.all([LectureDao.findByCourse(courseId), ProgressDao.find(userId, lectureId)]);
  return { courseId, lectures, current, progress: progress || { last_second: 0, watched_percent: 0, is_completed: false } };
}

export async function saveProgress(userId, input) {
  const { lectureId, lastSecond } = progressSchema(input);
  const lecture = await LectureDao.findById(lectureId);
  if (!lecture) throw new NotFoundError('Không tìm thấy bài giảng.');
  await requirePurchased(userId, lecture.course_id);
  const duration = Number(lecture.duration_sec);
  if (!Number.isFinite(duration) || duration <= 0) throw new ConflictError('Chưa xác định thời lượng bài giảng.');
  const previous = await ProgressDao.find(userId, lectureId);
  const safePosition = Math.min(duration, Math.max(lastSecond, Number(previous?.last_second || 0)));
  const progress = new Progress({ user_id: userId, lecture_id: lectureId });
  progress.calculateProgress(safePosition, duration);
  await ProgressDao.upsert(userId, lectureId, { last_second: progress.last_second, watched_percent: progress.watched_percent, is_completed: progress.is_completed });
  return progress;
}

export async function saveDuration(userId, input) {
  const { lectureId, duration } = durationSchema(input);
  const lecture = await LectureDao.findById(lectureId);
  if (!lecture) throw new NotFoundError('Không tìm thấy bài giảng.');
  await requirePurchased(userId, lecture.course_id);
  if (!Number(lecture.duration_sec)) await LectureDao.updateDurationIfMissing(lectureId, duration);
}
