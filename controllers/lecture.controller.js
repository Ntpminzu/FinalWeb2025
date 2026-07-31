import LectureDao from '../daos/lecture.dao.js';
import ProgressDao from '../daos/progress.dao.js';
import FeedbackDao from '../daos/feedback.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';
import Progress from '../models/progress.model.js';

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

async function ensurePurchased(userId, courseId) {
  return PurchasedDao.findByUserAndCourse(userId, courseId);
}

export async function showCourseLectures(req, res, next) {
  try {
    const courseId = positiveInteger(req.params.courseId);
    if (!courseId) return res.status(400).render('404');
    if (!await ensurePurchased(req.session.authUser.id, courseId)) {
      return res.status(403).render('403', { message: 'Bạn cần sở hữu khóa học để xem bài giảng.' });
    }

    const [lectures, feedbacks] = await Promise.all([
      LectureDao.findByCourse(courseId),
      FeedbackDao.findByCourse(courseId),
    ]);
    return res.render('vwStudent/course-lectures', { courseId, lectures, feedbacks });
  } catch (error) {
    return next(error);
  }
}

export async function getLecture(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const courseId = positiveInteger(req.params.courseId);
    const lectureId = positiveInteger(req.params.lectureId);
    if (!courseId || !lectureId) return res.status(400).render('404');
    if (!await ensurePurchased(userId, courseId)) {
      return res.status(403).render('403', { message: 'Bạn cần sở hữu khóa học để xem bài giảng.' });
    }

    const current = await LectureDao.findById(lectureId);
    if (!current || Number(current.course_id) !== courseId) return res.status(404).render('404');

    const [lectures, progress] = await Promise.all([
      LectureDao.findByCourse(courseId),
      ProgressDao.find(userId, lectureId),
    ]);
    return res.render('vwStudent/learn', {
      courseId,
      lectures,
      current,
      progress: progress || { last_second: 0, watched_percent: 0, is_completed: false },
    });
  } catch (error) {
    return next(error);
  }
}

export async function saveProgress(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const lectureId = positiveInteger(req.body.lecture_id);
    const lastSecond = Number(req.body.last_second);
    if (!lectureId || !Number.isFinite(lastSecond) || lastSecond < 0) {
      return res.status(400).json({ ok: false, message: 'Dữ liệu tiến độ không hợp lệ.' });
    }

    const lecture = await LectureDao.findById(lectureId);
    if (!lecture || !await ensurePurchased(userId, lecture.course_id)) {
      return res.status(403).json({ ok: false });
    }

    const duration = Number(lecture.duration_sec);
    if (!Number.isFinite(duration) || duration <= 0) {
      return res.status(409).json({ ok: false, message: 'Chưa xác định thời lượng bài giảng.' });
    }

    const previous = await ProgressDao.find(userId, lectureId);
    const safePosition = Math.min(duration, Math.max(lastSecond, Number(previous?.last_second || 0)));
    const progress = new Progress({ user_id: userId, lecture_id: lectureId });
    progress.calculateProgress(safePosition, duration);

    await ProgressDao.upsert(userId, lectureId, {
      last_second: progress.last_second,
      watched_percent: progress.watched_percent,
      is_completed: progress.is_completed,
    });
    return res.json({ ok: true, watched_percent: progress.watched_percent });
  } catch (error) {
    return next(error);
  }
}

export async function saveLectureDuration(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const lectureId = positiveInteger(req.body.lecture_id);
    const duration = Number(req.body.duration_sec);
    if (!lectureId || !Number.isFinite(duration) || duration < 1 || duration > 43200) {
      return res.status(400).json({ ok: false });
    }

    const lecture = await LectureDao.findById(lectureId);
    if (!lecture || !await ensurePurchased(userId, lecture.course_id)) {
      return res.status(403).json({ ok: false });
    }

    if (!Number(lecture.duration_sec)) {
      await LectureDao.updateDurationIfMissing(lectureId, Math.floor(duration));
    }
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
}
