import express from 'express';
import * as courseModel from '../models/course.model.js';
// (Đã cập nhật import theo "named export" cho CẢ HAI model)
import * as enrollmentModel from '../models/enrollment.model.js';

const router = express.Router();

/**
 * Thêm vào giỏ
 */
router.post('/add', async (req, res, next) => {
    try {
        const courseId = req.body.course_id;
        const course = await courseModel.findById(courseId);

        if (course) {
            let isCourseInCart = false;
            for (const item of req.session.cart) {
                if (item.id.toString() === course.id.toString()) {
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

/**
 * Xóa khỏi giỏ
 */
router.post('/remove', (req, res) => {
    const courseIdToRemove = req.body.course_id;
    req.session.cart = req.session.cart.filter(item => {
        return item.id.toString() !== courseIdToRemove;
    });
    res.redirect('/cart');
});

/**
 * Hiển thị trang giỏ hàng
 */
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
        total: total
    });
});

/**
 * Xử lý "Tiến hành thanh toán" (ĐÃ SỬA LỖI "duplicate key")
 */
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

        // 1. Lấy danh sách ID các khóa học user ĐÃ SỞ HỮU
        const ownedCourseIds = await enrollmentModel.findCourseIdsByUserId(userId);

        // 2. Lọc giỏ hàng, chỉ giữ lại các khóa học CHƯA SỞ HỮU
        const coursesToEnroll = cart.filter(item => {
            return !ownedCourseIds.includes(item.id.toString());
        });

        // 3. Nếu có khóa học mới để đăng ký
        if (coursesToEnroll.length > 0) {
            const now = new Date();
            const enrollData = coursesToEnroll.map(course => ({
                user_id: userId,
                course_id: course.id,
                enrolled_at: now
            }));

            await enrollmentModel.add(enrollData);
        }

        // 4. Xóa toàn bộ giỏ hàng (vì đã xử lý xong)
        req.session.cart = [];

        // 5. Chuyển hướng
        res.redirect('/student/courses');

    } catch (err) {
        console.error('Lỗi khi thanh toán:', err);
        next(err);
    }
});

export default router;