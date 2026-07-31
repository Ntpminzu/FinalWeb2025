import CourseDao from '../daos/course.dao.js';
import ProgressDao from '../daos/progress.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';
import WatchlistDao from '../daos/watchlist.dao.js';
import { NotFoundError } from '../errors/app-error.js';
import { positiveInteger } from '../validators/common.schema.js';

export const listWatchlist = userId => WatchlistDao.findAllByUser(userId);

export async function addToWatchlist(userId, rawCourseId, requestedTitle) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const course = await CourseDao.findById(courseId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  if (!await WatchlistDao.isInWatchlist(userId, courseId)) {
    const courseTitle = String(requestedTitle || course.title || '').trim() || null;
    await WatchlistDao.add({ user_id: userId, course_id: courseId, course_title: courseTitle });
  }
  return courseId;
}

export async function removeFromWatchlist(userId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  await WatchlistDao.remove(userId, courseId);
}

export async function purchasedCourses(userId) {
  const courses = await PurchasedDao.findAllByUser(userId);
  return Promise.all(courses.map(async course => {
    const { percent } = await ProgressDao.courseCompletion(userId, course.course_id);
    return { ...course, completion_percent: percent, is_completed: percent >= 90 };
  }));
}
