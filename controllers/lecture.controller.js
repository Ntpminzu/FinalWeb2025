import LectureDao from '../daos/lecture.dao.js';
import ProgressDao from '../daos/progress.dao.js';
import FeedbackDao from '../daos/feedback.dao.js';
import Progress from '../models/progress.model.js';

// ══════════════════════════════════════════
// UC [10] Watch Lecture
// Class Diagram: Student.watchLecture(cId, lId)
// ══════════════════════════════════════════

export async function showCourseLectures(req, res) {
  const { courseId } = req.params;

  const lectures = await LectureDao.findByCourse(courseId);
  const feedbacks = await FeedbackDao.findByCourse(courseId);
  res.render('vwStudent/course-lectures', {
    courseId,
    lectures,
    feedbacks
  });
}

/**
 * Xem bài giảng (video player).
 * UC [10] Main Flow: Student chọn bài giảng → hệ thống tải video.
 * Tương ứng getLecture(userId, courseId, lectureId) trong Sequence Diagram.
 */
export async function getLecture(req, res) {
  const user = req.session.authUser;
  const { courseId, lectureId } = req.params;

  const lectures = await LectureDao.findByCourse(courseId);
  const current = await LectureDao.findById(lectureId);
  if (!current) return res.status(404).render('404');

  const prog = await ProgressDao.find(user.id, current.id);

  res.render('vwStudent/learn', {
    courseId,
    lectures,
    current,
    progress: prog || { last_second: 0, watched_percent: 0, is_completed: false }
  });
}

// ══════════════════════════════════════════
// Class Diagram: Student.saveProgress(lId, sec)
// ══════════════════════════════════════════

/**
 * API lưu tiến trình học.
 * UC [10] Main Flow Step 5: Hệ thống tự động lưu khi Actor xem xong.
 */
export async function saveProgress(req, res) {
  const user = req.session.authUser;
  const { lecture_id, last_second, duration_sec } = req.body;

  // Sử dụng domain model Progress để tính toán tiến trình học
  const progress = new Progress({ user_id: user.id, lecture_id });
  progress.calculateProgress(last_second, duration_sec);

  await ProgressDao.upsert(user.id, lecture_id, {
    last_second: progress.last_second,
    watched_percent: progress.watched_percent,
    is_completed: progress.is_completed
  });
  res.json({ ok: true });
}

export async function saveLectureDuration(req, res) {
  const { lecture_id, duration_sec } = req.body;
  if (!lecture_id || !duration_sec) return res.json({ ok: false });

  await LectureDao.updateDuration(lecture_id, Math.max(1, Number(duration_sec)));
  return res.json({ ok: true });
}
