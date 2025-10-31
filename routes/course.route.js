import express from 'express';
import * as courseModel from '../models/course.model.js';
const router = express.Router();

const COURSES_PER_PAGE = 9; // (Bạn có thể đổi số này)

// === SỬA LẠI TOÀN BỘ ROUTE NÀY ===
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

// ... (route router.get('/:id', ...) của bạn giữ nguyên) ...

export default router;