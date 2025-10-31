import express from 'express';
import * as courseModel from '../models/course.model.js';
const router = express.Router();
const COURSES_PER_PAGE = 9;

router.get('/', async function (req, res, next) { // Thêm next
  try {
    // Logic phân trang
    const page = parseInt(req.query.page || 1, 10);
    const limit = COURSES_PER_PAGE;
    const offset = (page - 1) * limit;

    // Gọi 2 hàm model (đếm và lấy)
    const [courses, totalCourses] = await Promise.all([
      courseModel.findPageAll(limit, offset),
      courseModel.countAll()
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    res.render('vwCourse/list', {
      layout: 'main',
      courses: courses,
      empty: courses.length === 0,
      pagination: {
        totalPages: totalPages,
        currentPage: page,
        queryString: null // <-- Không có query string
      }
    });

  } catch (err) {
    console.error(err);
    next(err); // Dùng next(err)
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