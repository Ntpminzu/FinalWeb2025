import * as reviewService from '../services/review.service.js';
import { created, ok } from '../../../common/utils/api-response.js';

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

export async function myReview(req, res, next) {
  try {
    const data = await reviewService.getReviewContext(req.user.id, req.params.courseId);
    return ok(res, { courseId: data.courseId, canReview: data.canReview, completion: data.completion, review: data.myFeedback ? { rating: Number(data.myFeedback.rating), comment: data.myFeedback.comment, createdAt: data.myFeedback.created_at } : null });
  } catch (error) { return next(error); }
}
