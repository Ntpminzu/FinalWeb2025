import express from 'express';
import * as courseModel from '../models/course.model.js';
const router = express.Router();

router.get('/', async function (req, res) {
  try {
    const list = await courseModel.findAll();
    res.render('vwCourse/list', {
      layout: 'main',
      courses: list,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
});


router.get('/:id', async function (req, res, next) { // Thêm 'next'
  try {
    const courseId = req.params.id;

    // =============================================
    // === 1. THÊM DÒNG NÀY ĐỂ ĐẾM LƯỢT XEM ===
    await courseModel.incrementViewCount(courseId);
    // =============================================

    // 2. Lấy thông tin khóa học (như cũ)
    const course = await courseModel.findById(courseId);
    if (!course) {
      return res.status(404).render('404');
    }

    // 3. Render trang chi tiết (như cũ)
    res.render('vwCourse/details', {
      layout: 'main',
      course: course
    });

  } catch (err) {
    console.error(err);
    next(err); // Chuyển lỗi cho middleware xử lý
  }
});

export default router;