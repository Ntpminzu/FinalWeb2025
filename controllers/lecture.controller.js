import * as learningService from '../services/learning.service.js';

export async function showCourseLectures(req, res, next) {
  try {
    return res.render('vwStudent/course-lectures', await learningService.courseLectures(req.session.authUser.id, req.params.courseId));
  } catch (error) { return next(error); }
}

export async function getLecture(req, res, next) {
  try {
    return res.render('vwStudent/learn', await learningService.lectureDetail(req.session.authUser.id, req.params.courseId, req.params.lectureId));
  } catch (error) { return next(error); }
}

export async function saveProgress(req, res, next) {
  try {
    const progress = await learningService.saveProgress(req.session.authUser.id, req.body);
    return res.json({ ok: true, watched_percent: progress.watched_percent });
  } catch (error) { return next(error); }
}

export async function saveLectureDuration(req, res, next) {
  try {
    await learningService.saveDuration(req.session.authUser.id, req.body);
    return res.json({ ok: true });
  } catch (error) { return next(error); }
}
