import express from 'express';
import * as courseModel from '../models/course.model.js';
import * as purchasedModel from '../models/purchased.model.js'; // ✅ dùng purchased

const router = express.Router();

/** Thêm vào giỏ */
router.post('/add', async (req, res, next) => {
  try {
    const courseId = req.body.course_id;
    const course = await courseModel.findById(courseId);

    if (course) {
      let isCourseInCart = false;
      for (const item of req.session.cart) {
        if (String(item.id) === String(course.id)) {
          isCourseInCart = true;
          break;
        }
      }
      if (!isCourseInCart) {
        req.session.cart.push(course);
      }
    }
    res.redirect(req.headers.referer || '/');
  } catch (err) {
    next(err);
  }
});

/** Xóa khỏi giỏ */
router.post('/remove', (req, res) => {
  const courseIdToRemove = req.body.course_id;
  req.session.cart = (req.session.cart || []).filter(item => String(item.id) !== String(courseIdToRemove));
  res.redirect('/cart');
});

/** Trang giỏ hàng */
router.get('/', (req, res) => {
  const cartCourses = req.session.cart || [];
  let total = 0;
  for (const course of cartCourses) {
    const priceToSum = course.sale_price || course.price || 0;
    total += parseFloat(priceToSum);
  }
  res.render('vwCart/list', {
    layout: 'main',
    courses: cartCourses,
    empty: cartCourses.length === 0,
    total
  });
});

/** Thanh toán → ghi vào purchased (không còn enrollments) */
router.post('/checkout', async (req, res, next) => {
  try {
    if (!req.session.isAuthenticated) {
      return res.redirect('/account/signin');
    }

    const cart = req.session.cart || [];
    const userId = req.session.authUser.id;

    if (cart.length === 0) {
      return res.redirect('/cart');
    }

    // 1) Khóa học user đã mua
    const ownedCourseIds = await purchasedModel.findCourseIdsByUserId(userId);

    // 2) Lọc chỉ giữ khóa học chưa mua
    const toBuy = cart.filter(item => !ownedCourseIds.includes(String(item.id)));

    // 3) Ghi purchased
    if (toBuy.length > 0) {
      const now = new Date();
      const rows = toBuy.map(c => ({
        user_id: userId,
        course_id: c.id,
        course_title: c.title,      // cột trong bảng purchased
        purchased_at: now
      }));
      await purchasedModel.addMany(rows);
    }

    // 4) Xóa giỏ và chuyển
    req.session.cart = [];
    res.redirect('/student/courses'); // hoặc trang "đã mua" nếu bạn có

  } catch (err) {
    console.error('Lỗi khi thanh toán:', err);
    next(err);
  }
});

export default router;
