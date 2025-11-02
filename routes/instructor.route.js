// instructor.route.js
import express from 'express';
import multer from 'multer';
import db from '../utils/db.js';
import * as instructorModel from '../models/instructor.model.js';
import { restrictInstructor } from '../middlewares/auth.mdw.js';

const router = express.Router();

import fs from 'fs';
import path from 'path';

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.mimetype.startsWith('video/')
      ? path.join(process.cwd(), 'uploads', 'videos')
      : path.join(process.cwd(), 'uploads', 'thumbnails');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-thumbnail${ext}`);
  },
});
const upload = multer({ storage });

router.get('/', (req, res) => res.redirect('/instructor/dashboard'));

router.get('/dashboard', restrictInstructor, async (req, res) => {
  try {
    const instructorId = req.session.authUser.id;
    const courses = await instructorModel.getCoursesByInstructor(instructorId);
    res.render('vwInstructor/dashboard', { courses });
  } catch (err) {
    console.error('❌ Lỗi khi tải Dashboard:', err);
    res.status(500).send('Không thể tải trang Dashboard.');
  }
});

// Form tạo khóa học mới
router.get('/new', restrictInstructor, async (req, res) => {
  try {
    const categories = await instructorModel.getAllCategories();
    res.render('vwInstructor/new', {
      categories,
      authUser: req.session?.authUser || null,
    });
  } catch (err) {
    console.error('❌ Lỗi khi tải form tạo khóa học:', err);
    res.status(500).send('Không thể tải form tạo khóa học.');
  }
});

// Xử lý tạo khóa học mới
router.post('/new', restrictInstructor, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, category_id, short_desc, full_desc, price, sale_price } = req.body;
    const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

    await instructorModel.addCourse({
      instructor_id: req.session.authUser.id,
      title,
      category_id,
      short_desc,
      full_desc,
      description: full_desc,
      price,
      sale_price,
      thumbnail,
    });

    res.redirect('/instructor/dashboard');
  } catch (err) {
    console.error('❌ Lỗi khi thêm khóa học:', err);
    res.status(500).send('Đã xảy ra lỗi khi tạo khóa học.');
  }
});


// ---------------- KHÓA HỌC ----------------

// Trang chỉnh sửa khóa học (đã tách riêng)
router.get('/edit/course/:id', restrictInstructor, async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await instructorModel.getCourseById(courseId);
    const lectures = await instructorModel.getLecturesByCourse(courseId);

    const categories = await instructorModel.getAllCategories();
    res.render('vwInstructor/edit-course', {
      course,
      lectures,
      categories,
      authUser: req.session.authUser
    });
  } catch (err) {
    console.error('❌ Lỗi khi tải trang chỉnh sửa:', err);
    res.status(500).send('Không thể tải thông tin khóa học.');
  }
});


// Cập nhật thông tin khóa học
router.post('/edit/:id', restrictInstructor, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, short_desc, full_desc, category_id, price, sale_price } = req.body;
    const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

    await instructorModel.updateCourse(req.params.id, {
      title,
      short_desc,
      full_desc,
      description: full_desc,
      price,
      sale_price,
      thumbnail,
    });

    res.redirect('/instructor/dashboard');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật khóa học:', err);
    res.status(500).send('Không thể cập nhật khóa học.');
  }
});
// Trang quản lý bài giảng riêng (tách ra khỏi chỉnh sửa khóa học)
router.get('/edit/lectures/:id', restrictInstructor, async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await instructorModel.getCourseById(courseId);
    const lectures = await instructorModel.getLecturesByCourse(courseId);

    res.render('vwInstructor/edit-lectures', { course, lectures });
  } catch (err) {
    console.error('❌ Lỗi khi tải danh sách bài giảng:', err);
    res.status(500).send('Không thể tải danh sách bài giảng.');
  }
});

// Thêm bài giảng (chỉ nhập link video)
router.post('/lectures/:courseId/add', restrictInstructor, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, video_url } = req.body;

    if (!title || !video_url) {
      return res.status(400).send('Thiếu tiêu đề hoặc link video.');
    }

    await instructorModel.addLecture(courseId, title, video_url);

    res.redirect(`/instructor/edit/lectures/${courseId}`);
  } catch (err) {
    console.error('❌ Lỗi thêm bài giảng:', err);
    res.status(500).send('Không thể thêm bài giảng.');
  }
});


// Xóa bài giảng
router.post('/lectures/:lectureId/delete', restrictInstructor, async (req, res) => {
  try {
    const { lectureId } = req.params;
    await instructorModel.deleteLecture(lectureId);
    res.redirect('back');
  } catch (err) {
    console.error('❌ Lỗi xóa bài giảng:', err);
    res.status(500).send('Không thể xóa bài giảng.');
  }
});

// ---------------- HỒ SƠ GIẢNG VIÊN ----------------

// Trang hồ sơ giảng viên
router.get('/profile', restrictInstructor, async (req, res) => {
  try {
    const instructorId = req.session.authUser.id;
    const instructor = await instructorModel.findById(instructorId);
    const courses = await instructorModel.getCoursesByInstructor(instructorId);

    res.render('vwInstructor/profile', {
      instructor,
      courses,
      authUser: req.session.authUser,
    });
  } catch (err) {
    console.error('❌ Lỗi khi tải hồ sơ giảng viên:', err);
    res.status(500).send('Không thể tải hồ sơ giảng viên.');
  }
});

// Trang chỉnh sửa hồ sơ (tách riêng view)
router.get('/profile/edit', restrictInstructor, async (req, res) => {
  try {
    const instructor = await instructorModel.findById(req.session.authUser.id);
    res.render('vwInstructor/edit-profile', { instructor });
  } catch (err) {
    console.error('❌ Lỗi khi tải trang chỉnh sửa hồ sơ:', err);
    res.status(500).send('Không thể tải trang chỉnh sửa hồ sơ.');
  }
});

// Cập nhật thông tin hồ sơ
router.post('/profile/edit', restrictInstructor, async (req, res) => {
  try {
    const { bio, specialization } = req.body;
    await instructorModel.update(req.session.authUser.id, { bio, specialization });
    res.redirect('/instructor/profile');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật hồ sơ:', err);
    res.status(500).send('Không thể cập nhật hồ sơ.');
  }
});
router.post('/courses/toggle/:id', restrictInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const course = await db('courses').where('id', id).first();
    if (!course) return res.status(404).send('Không tìm thấy khóa học');

    const newStatus = !course.Status;

    await db('courses')
      .where('id', id)
      .update({
        Status: newStatus,
        updated_at: new Date(),
      });

    res.redirect('/instructor/dashboard');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật Status:', err);
    res.status(500).send('Không thể cập nhật Status.');
  }
});
export default router;