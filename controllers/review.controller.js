import * as reviewService from '../services/review.service.js';
import { ValidationError } from '../errors/app-error.js';

export async function checkReviewStatus(req, res, next) {
  try {
    const context = await reviewService.getReviewContext(req.session.authUser.id, req.params.courseId);
    return res.render('vwStudent/feedback', { ...context, ok: req.query.ok === '1' });
  } catch (error) { return next(error); }
}

export async function submitReview(req, res, next) {
  try {
    const courseId = await reviewService.submitReview(req.session.authUser.id, req.params.courseId, req.body);
    return res.redirect(`/student/course/${courseId}/feedback?ok=1`);
  } catch (error) {
    if (error instanceof ValidationError) {
      try {
        const context = await reviewService.getReviewContext(req.session.authUser.id, req.params.courseId);
        return res.status(400).render('vwStudent/feedback', { ...context, error: error.message });
      } catch (contextError) { return next(contextError); }
    }
    return next(error);
  }
}
