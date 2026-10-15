import CourseRepository from '../../courses/repositories/course.repository.js';
import WatchlistRepository from '../repositories/watchlist.repository.js';
import { NotFoundError } from '../../../common/errors/app-error.js';
import { positiveInteger } from '../../../common/schemas/common.schema.js';

export const listWatchlist = userId => WatchlistRepository.findAllByUser(userId);

export async function addToWatchlist(userId, rawCourseId, requestedTitle) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const course = await CourseRepository.findById(courseId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  if (!await WatchlistRepository.isInWatchlist(userId, courseId)) {
    const courseTitle = String(requestedTitle || course.title || '').trim() || null;
    await WatchlistRepository.add({ user_id: userId, course_id: courseId, course_title: courseTitle });
  }
  return courseId;
}

export async function removeFromWatchlist(userId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  await WatchlistRepository.remove(userId, courseId);
}
