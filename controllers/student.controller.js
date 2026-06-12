// controllers/student.controller.js

import bcrypt from 'bcryptjs';
import * as userModel from '../models/user.model.js';
import * as watchlistModel from '../models/watchlist.model.js';
import * as purchasedModel from '../models/purchased.model.js';
import * as courseModel from '../models/course.model.js';
import * as lectureModel from '../models/lecture.model.js';
import * as progressModel from '../models/progress.model.js';
import * as feedbackModel from '../models/feedback.model.js';

/** Student Home */
export function home(req, res) {
  res.render('vwStudent/home', {
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    authUser: req.session.authUser,
  });
}

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

/** Profile - Cập nhật tên & email */
export async function updateProfile(req, res) {
  const id = req.body.id;
  const updatedUser = {
    name: req.body.name?.trim(),
    email: req.body.email?.trim(),
  };

  await userModel.patch(id, updatedUser);

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

/** Đổi mật khẩu */
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
  await userModel.patch(id, { password: hashed });

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

//----------------------------- Watchlist

export async function showWatchlist(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const items = await watchlistModel.findAllByUser(userId);

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

export async function addToWatchlist(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const courseId = Number(req.body.course_id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).send('course_id không hợp lệ');
    }

    // kiểm tra khóa học có tồn tại
    const course = await courseModel.findById(courseId);
    if (!course) return res.status(404).render('404');

    const title = (req.body.course_title ?? course.title ?? null)?.toString() ?? null;

    const existed = await watchlistModel.isInWatchlist(userId, courseId);
    if (!existed) {
      await watchlistModel.add({ user_id: userId, course_id: courseId, course_title: title });
    }

    // về trang trước nếu có, mặc định về trang chi tiết course
    const back = req.get('Referer') || `/courses/${courseId}`;
    return res.redirect(back);
  } catch (err) {
    next(err);
  }
}

export async function removeFromWatchlist(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const courseId = Number(req.body.course_id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).send('course_id không hợp lệ');
    }

    await watchlistModel.remove(userId, courseId);

    return res.redirect('/student/watchlist?removed=1');
  } catch (err) {
    next(err);
  }
}

//----------------------------- Purchased Courses

export async function showPurchasedCourses(req, res) {
  const userId = req.session.authUser.id;

  // danh sách khóa đã mua
  const purchasedCourses = await purchasedModel.listByUser(userId);

  // gắn thêm % hoàn thành và cờ is_completed
  const coursesWithProgress = await Promise.all(
    purchasedCourses.map(async (c) => {
      const { percent } = await progressModel.courseCompletion(userId, c.course_id);
      return {
        ...c,
        completion_percent: percent,          
        is_completed: percent >= 90        
      };
    })
  );

  res.render('vwStudent/courses', { purchasedCourses: coursesWithProgress });
}

//-----------------------------

export async function showCourseLectures(req, res) {
  const { courseId } = req.params;

  const lectures = await lectureModel.findByCourse(courseId);
  const feedbacks = await feedbackModel.findByCourse(courseId);
  res.render('vwStudent/course-lectures', {
    courseId,
    lectures,
    feedbacks
  });
}

export async function showLearn(req, res) {
  const user = req.session.authUser;
  const { courseId, lectureId } = req.params;

  const lectures = await lectureModel.findByCourse(courseId);
  const current = await lectureModel.findById(lectureId);
  if (!current) return res.status(404).render('404');

  const prog = await progressModel.find(user.id, current.id);

  res.render('vwStudent/learn', {
    courseId,
    lectures,
    current,
    progress: prog || { last_second: 0, watched_percent: 0, is_completed: false }
  });
}

/* API lưu tiến trình */
export async function saveProgress(req, res) {
  const user = req.session.authUser;
  const { lecture_id, last_second, duration_sec } = req.body;

  const duration = Math.max(1, Number(duration_sec) || 1);
  const last = Math.max(0, Number(last_second) || 0);
  const watched_percent = Math.min(100, (last / duration) * 100);
  const is_completed = watched_percent >= 90;

  await progressModel.upsert(user.id, lecture_id, { last_second: last, watched_percent, is_completed });
  res.json({ ok: true });
}

export async function saveLectureDuration(req, res) {
  const { lecture_id, duration_sec } = req.body;
  if (!lecture_id || !duration_sec) return res.json({ ok: false });

  await lectureModel.updateDuration(lecture_id, Math.max(1, Number(duration_sec)));
  return res.json({ ok: true });
}

//-----------------------------
// Đánh giá khoá học

export async function showFeedbackForm(req, res) {
  const user = req.session.authUser;
  const { courseId } = req.params;

  const course = await courseModel.findById(courseId);
  if (!course) return res.status(404).render('404');

  // phải mua khoá
  const purchased = await purchasedModel.isPurchased(user.id, courseId);

  // % hoàn thành
  const completion = await progressModel.courseCompletion(user.id, courseId);
  const canReview = purchased && completion.total > 0 && completion.done >= 1;

  const myFeedback = await feedbackModel.findByUserCourse(user.id, courseId);

  return res.render('vwStudent/feedback', {
    course,
    completion,              
    canReview,
    myFeedback,             
    ok: req.query.ok === '1' 
  });
}

export async function submitFeedback(req, res) {
  const user = req.session.authUser;
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  // validate căn bản
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).render('vwStudent/feedback', {
      course: await courseModel.findById(courseId),
      canReview: true,
      myFeedback: null,
      completion: await progressModel.courseCompletion(user.id, courseId),
      error: 'Rating phải từ 1 đến 5 sao.',
    });
  }

  // kiểm tra quyền đánh giá (đã mua + đã học 1 bài)
  const purchased = await purchasedModel.isPurchased(user.id, courseId);
  const completion = await progressModel.courseCompletion(user.id, courseId);
  const canReview = purchased && completion.total > 0 && completion.done >= 1;
  if (!canReview) return res.status(403).render('403');

  await feedbackModel.upsert(user.id, courseId, r, (comment ?? '').trim());
  // Trigger DB sẽ tự cập nhật courses.rating_avg & rating_count
  return res.redirect(`/student/course/${courseId}/feedback?ok=1`);
}
