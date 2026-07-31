import CourseDao from '../daos/course.dao.js';
import FeedbackDao from '../daos/feedback.dao.js';
import ProgressDao from '../daos/progress.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';
import { ForbiddenError, NotFoundError } from '../errors/app-error.js';
import { positiveInteger } from '../validators/common.schema.js';
import { reviewSchema } from '../validators/course.schema.js';

export async function getReviewContext(userId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const course = await CourseDao.findById(courseId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  const [purchased, completion, myFeedback] = await Promise.all([
    PurchasedDao.findByUserAndCourse(userId, courseId),
    ProgressDao.courseCompletion(userId, courseId),
    FeedbackDao.findByUserCourse(userId, courseId),
  ]);
  return { courseId, course, completion, myFeedback, canReview: Boolean(purchased && completion.total > 0 && completion.done >= 1) };
}

export async function submitReview(userId, rawCourseId, input) {
  const context = await getReviewContext(userId, rawCourseId);
  if (!context.canReview) throw new ForbiddenError('Bạn cần sở hữu và học khóa học trước khi đánh giá.');
  const data = reviewSchema(input);
  await FeedbackDao.upsert(userId, context.courseId, data.rating, data.comment);
  return context.courseId;
}
