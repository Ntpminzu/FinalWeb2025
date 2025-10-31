import express from 'express';
import * as courseModel from '../models/course.model.js';
import * as feedbackModel from '../models/feedback.model.js';
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




router.get('/:id', async function (req, res, next) {
  try {
    const courseId = req.params.id;

    // 1. Tăng lượt xem (giữ nguyên)
    await courseModel.incrementViewCount(courseId);

    // 2. Lấy chi tiết khóa học VÀ feedback (chạy song song)
    const [course, feedbacks] = await Promise.all([
      courseModel.findById(courseId),
      // (Dùng hàm 'findByCourse' từ file bạn đã cung cấp)
      feedbackModel.findByCourse(courseId)
    ]);

    if (!course) {
      return res.status(404).render('404');
    }

    // 3. Render trang chi tiết với cả 2 bộ dữ liệu
    res.render('vwCourse/details', {
      layout: 'main',
      course: course,
      feedbacks: feedbacks, // <-- Gửi feedback ra view
      feedbackEmpty: feedbacks.length === 0 // <-- Gửi trạng thái rỗng
    });

  } catch (err) {
    console.error(err);
    next(err); // Chuyển lỗi cho middleware xử lý
  }
});
export default router;