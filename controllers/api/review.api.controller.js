import * as reviewService from '../../services/review.service.js';
import { created, ok } from '../../utils/api-response.js';

export async function submitReview(req, res, next) {
  try {
    const courseId = await reviewService.createReview(req.user.id, req.params.courseId, req.body);
    const context = await reviewService.getReviewContext(req.user.id, courseId);
    return created(res, {
      courseId,
      review: context.myFeedback
        ? {
            rating: Number(context.myFeedback.rating),
            comment: context.myFeedback.comment || '',
            createdAt: context.myFeedback.created_at,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyReview(req, res, next) {
  try {
    const courseId = await reviewService.updateReview(req.user.id, req.params.courseId, req.body);
    const context = await reviewService.getReviewContext(req.user.id, courseId);
    return ok(res, {
      courseId,
      review: context.myFeedback
        ? {
            rating: Number(context.myFeedback.rating),
            comment: context.myFeedback.comment || '',
            createdAt: context.myFeedback.created_at,
          }
        : null,
    });
  } catch (error) {
    return next(error);
  }
}
