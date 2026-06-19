/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «role» Student — Class Diagram (permission=1)              ║
 * ║  Kế thừa: User                                              ║
 * ║                                                              ║
 * ║  Methods (Class Diagram → Code Mapping):                     ║
 * ║    + viewCourseDetail(id): Course                            ║
 * ║        → see controllers/course.controller.js                ║
 * ║          (UC [03] View Course Details)                       ║
 * ║    + searchCourse(query): List                               ║
 * ║        → see controllers/search.controller.js                ║
 * ║          (UC [04] Search Course)                             ║
 * ║    + addToWatchlist(id): bool         ✅ addToWatchlist()    ║
 * ║    + removeFromWatchlist(id): bool    ✅ removeFromWatchlist()║
 * ║    + addToCart(id): bool                                     ║
 * ║        → see controllers/cart.controller.js                  ║
 * ║          (UC [05] Manage Cart)                               ║
 * ║    + checkout(): bool                                        ║
 * ║        → see controllers/cart.controller.js                  ║
 * ║          (UC [06] Checkout)                                  ║
 * ║    + watchLecture(cId,lId): void      ✅ showLearn()        ║
 * ║    + saveProgress(lId,sec): bool      ✅ saveProgress()     ║
 * ║    + viewCourseList(page): List       ✅ showPurchasedCourses()║
 * ║    + submitFeedback(cId,r,txt): bool  ✅ submitFeedback()   ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [09] View Purchased Courses, [10] Watch Lecture,          ║
 * ║    [11] Review Course, [12] Manage Watchlist,                ║
 * ║    [21] Manage Profile, [22] Change Password                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import bcrypt from 'bcryptjs';
import db from '../utils/db.js';
import UserDao from '../daos/user.dao.js';
import WatchlistDao from '../daos/watchlist.dao.js';
import CourseDao from '../daos/course.dao.js';
import LectureDao from '../daos/lecture.dao.js';
import ProgressDao from '../daos/progress.dao.js';
import FeedbackDao from '../daos/feedback.dao.js';

// ══════════════════════════════════════════
// Student Home
// ══════════════════════════════════════════

export function home(req, res) {
  res.render('vwStudent/home', {
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    authUser: req.session.authUser,
  });
}

// ══════════════════════════════════════════
// UC [21] Manage Profile — Student
// ══════════════════════════════════════════

/** Profile - Hiển thị */
export function showProfile(req, res) {
  res.render('vwStudent/profile', {
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    authUser: req.session.authUser,
    error: false,
    success: false,
  });
}

/**
 * Profile - Cập nhật tên & email.
 * Class Diagram: User.updateProfile()
 */
export async function updateProfile(req, res) {
  const id = req.body.id;
  const updatedUser = {
    name: req.body.name?.trim(),
    email: req.body.email?.trim(),
  };

  await UserDao.updateProfile(id, updatedUser);

  // cập nhật lại session
  req.session.authUser.name = updatedUser.name;
  req.session.authUser.email = updatedUser.email;

  res.render('vwStudent/profile', {
    user: req.session.authUser,
    isAuthenticated: true,
    authUser: req.session.authUser,
    error: false,
    success: 'Cập nhật thông tin thành công!',
  });
}

// ══════════════════════════════════════════
// UC [22] Change Password — Student
// ══════════════════════════════════════════

/**
 * Đổi mật khẩu.
 * Class Diagram: User.changePassword()
 */
export async function changePwd(req, res) {
  const id = req.body.id;
  const currentPassword = req.body.currentPassword || '';
  const newPassword = req.body.newPassword || '';

  // kiểm tra mật khẩu hiện tại
  const ok = bcrypt.compareSync(currentPassword, req.session.authUser.password);
  if (!ok) {
    return res.render('vwStudent/profile', {
      user: req.session.authUser,
      isAuthenticated: true,
      authUser: req.session.authUser,
      error: 'Mật khẩu hiện tại không đúng.',
      success: false,
    });
  }

  //  ràng buộc độ dài mật khẩu mới
  if (newPassword.length < 6) {
    return res.render('vwStudent/profile', {
      user: req.session.authUser,
      isAuthenticated: true,
      authUser: req.session.authUser,
      error: 'Mật khẩu mới phải tối thiểu 6 ký tự.',
      success: false,
    });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  await UserDao.changePassword(id, hashed);

  // cập nhật session
  req.session.authUser.password = hashed;

  res.render('vwStudent/profile', {
    user: req.session.authUser,
    isAuthenticated: true,
    authUser: req.session.authUser,
    error: false,
    success: 'Đổi mật khẩu thành công!',
  });
}

// ══════════════════════════════════════════
// UC [12] Manage Watchlist
// Class Diagram: Student.addToWatchlist(id), removeFromWatchlist(id)
// ══════════════════════════════════════════

export async function showWatchlist(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const items = await WatchlistDao.findAllByUser(userId);

    return res.render('vwStudent/watchlist', {
      items,
      user: req.session.authUser,
      isAuthenticated: req.session.isAuthenticated,
      authUser: req.session.authUser,
      ok: req.query.ok === '1',
      removed: req.query.removed === '1'
    });
  } catch (err) {
    next(err);
  }
}

// ─── Class Diagram: Student.addToWatchlist(id) ── UC [12] (a. Thêm) ───
export async function addToWatchlist(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const courseId = Number(req.body.course_id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).send('course_id không hợp lệ');
    }

    // kiểm tra khóa học có tồn tại
    const course = await CourseDao.findById(courseId);
    if (!course) return res.status(404).render('404');

    const title = (req.body.course_title ?? course.title ?? null)?.toString() ?? null;

    const existed = await WatchlistDao.isInWatchlist(userId, courseId);
    if (!existed) {
      await WatchlistDao.add({ user_id: userId, course_id: courseId, course_title: title });
    }

    // về trang trước nếu có, mặc định về trang chi tiết course
    const back = req.get('Referer') || `/courses/${courseId}`;
    return res.redirect(back);
  } catch (err) {
    next(err);
  }
}

// ─── Class Diagram: Student.removeFromWatchlist(id) ── UC [12] (b. Xóa) ───
export async function removeFromWatchlist(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const courseId = Number(req.body.course_id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).send('course_id không hợp lệ');
    }

    await WatchlistDao.remove(userId, courseId);

    return res.redirect('/student/watchlist?removed=1');
  } catch (err) {
    next(err);
  }
}

// ══════════════════════════════════════════
// UC [09] View Purchased Courses
// Class Diagram: Student.viewCourseList(page)
// ══════════════════════════════════════════

export async function showPurchasedCourses(req, res) {
  const userId = req.session.authUser.id;

  // danh sách khóa đã mua (truy vấn trực tiếp DB — đã xoá purchased.model.js)
  const purchasedCourses = await db('purchased as p')
    .leftJoin('courses as c', 'p.course_id', 'c.id')
    .where('p.user_id', userId)
    .select(
      'p.course_id',
      'p.course_title',
      'p.purchased_at',
      'c.thumbnail',
      'c.short_desc',
      'c.price',
      'c.sale_price'
    )
    .orderBy('p.purchased_at', 'desc');

  // gắn thêm % hoàn thành và cờ is_completed
  const coursesWithProgress = await Promise.all(
    purchasedCourses.map(async (c) => {
      const { percent } = await ProgressDao.courseCompletion(userId, c.course_id);
      return {
        ...c,
        completion_percent: percent,          
        is_completed: percent >= 90        
      };
    })
  );

  res.render('vwStudent/courses', { purchasedCourses: coursesWithProgress });
}

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
 */
export async function showLearn(req, res) {
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

  const duration = Math.max(1, Number(duration_sec) || 1);
  const last = Math.max(0, Number(last_second) || 0);
  const watched_percent = Math.min(100, (last / duration) * 100);
  const is_completed = watched_percent >= 90;

  await ProgressDao.upsert(user.id, lecture_id, { last_second: last, watched_percent, is_completed });
  res.json({ ok: true });
}

export async function saveLectureDuration(req, res) {
  const { lecture_id, duration_sec } = req.body;
  if (!lecture_id || !duration_sec) return res.json({ ok: false });

  await LectureDao.updateDuration(lecture_id, Math.max(1, Number(duration_sec)));
  return res.json({ ok: true });
}

// ══════════════════════════════════════════
// UC [11] Review Course
// Class Diagram: Student.submitFeedback(cId, r, txt)
// ══════════════════════════════════════════

/**
 * Hiển thị form đánh giá.
 * UC [11] Main Flow: Kiểm tra quyền → hiển thị form.
 * Exception 3.1: Nếu đã đánh giá → hiển thị đánh giá cũ để chỉnh sửa.
 */
export async function showFeedbackForm(req, res) {
  const user = req.session.authUser;
  const { courseId } = req.params;

  const course = await CourseDao.findById(courseId);
  if (!course) return res.status(404).render('404');

  // phải mua khoá (truy vấn trực tiếp DB)
  const purchased = await db('purchased')
    .where({ user_id: user.id, course_id: courseId })
    .first();

  // % hoàn thành
  const completion = await ProgressDao.courseCompletion(user.id, courseId);
  const canReview = purchased && completion.total > 0 && completion.done >= 1;

  const myFeedback = await FeedbackDao.findByUserCourse(user.id, courseId);

  return res.render('vwStudent/feedback', {
    course,
    completion,              
    canReview,
    myFeedback,             
    ok: req.query.ok === '1' 
  });
}

/**
 * Gửi đánh giá khóa học.
 * UC [11] Main Flow Step 4-7: Actor chọn sao + nhận xét → lưu → cập nhật rating.
 */
export async function submitFeedback(req, res) {
  const user = req.session.authUser;
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  // validate căn bản — Rate enum (1–5)
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).render('vwStudent/feedback', {
      course: await CourseDao.findById(courseId),
      canReview: true,
      myFeedback: null,
      completion: await ProgressDao.courseCompletion(user.id, courseId),
      error: 'Rating phải từ 1 đến 5 sao.',
    });
  }

  // kiểm tra quyền đánh giá (đã mua + đã học 1 bài)
  const purchased = await db('purchased')
    .where({ user_id: user.id, course_id: courseId })
    .first();
  const completion = await ProgressDao.courseCompletion(user.id, courseId);
  const canReview = purchased && completion.total > 0 && completion.done >= 1;
  if (!canReview) return res.status(403).render('403');

  await FeedbackDao.upsert(user.id, courseId, r, (comment ?? '').trim());
  // Trigger DB sẽ tự cập nhật courses.rating_avg & rating_count
  return res.redirect(`/student/course/${courseId}/feedback?ok=1`);
}
