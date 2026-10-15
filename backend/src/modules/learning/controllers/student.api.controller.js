import { feedbackDto } from '../../reviews/dto/review.dto.js';
import { progressDto } from '../dto/learning.dto.js';
import { lectureDto } from '../dto/learning.dto.js';
import { purchasedCourseDto } from '../dto/learning.dto.js';
import * as learningService from '../services/learning.service.js';
import { ok } from '../../../common/utils/api-response.js';

export async function myCourses(req, res, next) {
  try {
    const courses = await learningService.purchasedCourses(req.user.id);
    return ok(res, courses.map(purchasedCourseDto));
  } catch (error) {
    return next(error);
  }
}





export async function courseProgress(req, res, next) {
  try {
    const result = await learningService.courseLectures(req.user.id, req.params.courseId);
    return ok(res, {
      courseId: result.courseId,
      lectures: result.lectures.map(lectureDto),
      feedbacks: result.feedbacks.map(feedbackDto),
      progress: result.progress.map(progressDto),
      completion: result.completion,
    });
  } catch (error) {
    return next(error);
  }
}



export async function lectureDetail(req, res, next) {
  try {
    const result = await learningService.lectureDetail(req.user.id, req.params.courseId, req.params.lectureId);
    return ok(res, { courseId: result.courseId, lectures: result.lectures.map(lectureDto), current: lectureDto(result.current), progress: progressDto({ ...result.progress, lecture_id: result.current.id }) });
  } catch (error) { return next(error); }
}
export async function duration(req, res, next) {
  try { return ok(res, await learningService.verifyDuration(req.user.id, req.params.lectureId, req.body)); }
  catch (error) { return next(error); }
}

export async function saveProgress(req, res, next) {
  try {
    const progress = await learningService.saveProgress(req.user.id, {
      lectureId: req.params.lectureId,
      lastSecond: req.body.lastSecond,
    });
    return ok(res, progressDto(progress));
  } catch (error) {
    return next(error);
  }
}
