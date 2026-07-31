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
 * ║    + watchLecture(cId,lId): void      ✅ getLecture()       ║
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
import UserDao from '../daos/user.dao.js';
import WatchlistDao from '../daos/watchlist.dao.js';
import CourseDao from '../daos/course.dao.js';
import ProgressDao from '../daos/progress.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';
import { safeReferrer } from '../utils/safe-redirect.js';

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
  const id = req.session.authUser.id;
  const updatedUser = {
    name: req.body.name?.trim(),
    email: req.body.email?.trim().toLowerCase(),
  };

  if (!updatedUser.name || updatedUser.name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedUser.email)) {
    return res.status(400).render('vwStudent/profile', {
      user: req.session.authUser,
      error: 'Thông tin hồ sơ không hợp lệ.',
      success: false,
    });
  }

  const emailOwner = await UserDao.findByEmail(updatedUser.email);
  if (emailOwner && Number(emailOwner.id) !== Number(id)) {
    return res.status(409).render('vwStudent/profile', {
      user: req.session.authUser,
      error: 'Email đã được sử dụng.',
      success: false,
    });
  }

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
  const id = req.session.authUser.id;
  const currentPassword = req.body.currentPassword || '';
  const newPassword = req.body.newPassword || '';
  const user = await UserDao.findById(id);

  // kiểm tra mật khẩu hiện tại
  const ok = user && await bcrypt.compare(currentPassword, user.password || '');
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
  if (newPassword.length < 8 || newPassword.length > 72) {
    return res.render('vwStudent/profile', {
      user: req.session.authUser,
      isAuthenticated: true,
      authUser: req.session.authUser,
      error: 'Mật khẩu mới phải có từ 8 đến 72 ký tự.',
      success: false,
    });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await UserDao.changePassword(id, hashed);

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
    const back = safeReferrer(req, `/courses/${courseId}`);
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

  // danh sách khóa đã mua (sử dụng PurchasedDao)
  const purchasedCourses = await PurchasedDao.findAllByUser(userId);

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





