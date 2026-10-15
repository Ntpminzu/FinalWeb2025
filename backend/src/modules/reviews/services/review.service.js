import CourseRepository from '../../courses/repositories/course.repository.js';
import FeedbackRepository from '../repositories/feedback.repository.js';
import ProgressRepository from '../../learning/repositories/progress.repository.js';
import PurchasedRepository from '../../learning/repositories/purchased.repository.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../common/errors/app-error.js';
import { positiveInteger } from '../../../common/schemas/common.schema.js';
import { reviewSchema } from '../schemas/review.schema.js';

export async function getReviewContext(userId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const course = await CourseRepository.findById(courseId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  const [purchased, completion, myFeedback] = await Promise.all([
    PurchasedRepository.findByUserAndCourse(userId, courseId),
    ProgressRepository.courseCompletion(userId, courseId),
    FeedbackRepository.findByUserCourse(userId, courseId),
  ]);
  return { courseId, course, completion, myFeedback, canReview: Boolean(purchased && completion.total > 0 && completion.done >= 1) };
}

export async function submitReview(userId, rawCourseId, input) {
  const context = await getReviewContext(userId, rawCourseId);
  if (!context.canReview) throw new ForbiddenError('Bạn cần sở hữu và học khóa học trước khi đánh giá.');
  const data = reviewSchema(input);
  await FeedbackRepository.upsert(userId, context.courseId, data.rating, data.comment);
  return context.courseId;
}

export async function createReview(userId, rawCourseId, input) {
  const context = await getReviewContext(userId, rawCourseId);
  if (!context.canReview) throw new ForbiddenError('Bạn cần sở hữu và học khóa học trước khi đánh giá.');
  if (context.myFeedback) throw new ConflictError('Bạn đã đánh giá khóa học này.');
  const data = reviewSchema(input);
  await FeedbackRepository.insert(userId, context.courseId, data.rating, data.comment);
  return context.courseId;
}

export async function updateReview(userId, rawCourseId, input) {
  const context = await getReviewContext(userId, rawCourseId);
  if (!context.canReview) throw new ForbiddenError('Bạn cần sở hữu và học khóa học trước khi đánh giá.');
  if (!context.myFeedback) throw new NotFoundError('Bạn chưa đánh giá khóa học này.');
  const data = reviewSchema(input);
  await FeedbackRepository.update(userId, context.courseId, data.rating, data.comment);
  return context.courseId;
}
