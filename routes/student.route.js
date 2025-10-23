import express from 'express';
import bcrypt from 'bcryptjs';
import { restrict } from '../middlewares/auth.mdw.js';
import * as userModel from '../models/user.model.js';
import * as watchlistModel from '../models/watchlist.model.js';
import * as purchasedModel from '../models/purchased.model.js';

const router = express.Router();

/** Chỉ cho phép student (permission = 1) */
function ensureStudent(req, res, next) {
  if (!req.session?.authUser || Number(req.session.authUser.permission) !== 1) {
    // Có thể đổi sang res.redirect('/') nếu bạn muốn trả về trang chủ
    return res.status(403).send('Forbidden: Students only.');
  }
  next();
}

// Áp dụng middleware cho toàn bộ /student
router.use(restrict, ensureStudent);

/** Student Home */
router.get('/', (req, res) => {
  res.render('vwStudent/home', {
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    authUser: req.session.authUser,
  });
});

/** Profile - Hiển thị */
router.get('/profile', (req, res) => {
  res.render('vwStudent/profile', {
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    authUser: req.session.authUser,
    error: false,
    success: false,
  });
});

/** Profile - Cập nhật tên & email */
router.post('/profile', async (req, res) => {
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
});

/** Đổi mật khẩu */
router.post('/change-pwd', async (req, res) => {
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

  // (tuỳ chọn) ràng buộc độ dài mật khẩu mới
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
});
router.get('/watchlist', async (req, res) => {
  const items = await watchlistModel.findAll();
  res.render('vwStudent/watchlist', { items });
});

router.post('/watchlist/add', async (req, res) => {
  const { course_id, course_title } = req.body;

  const existed = await watchlistModel.isInWatchlist(course_id);
  if (!existed) await watchlistModel.add(course_id, course_title);
  res.redirect('/courses/' + course_id);


});

router.post('/watchlist/remove', async (req, res) => {
  const { course_id } = req.body;
  await watchlistModel.remove(course_id);
  res.redirect('/student/watchlist');
}
);

router.get('/courses', async (req, res) => {
  const purchasedCourses = await purchasedModel.findAllCourses();
  res.render('vwStudent/courses', {
    purchasedCourses: Array.isArray(purchasedCourses) ? purchasedCourses : [],
  });
});


export default router;
