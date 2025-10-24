import express from 'express';
import * as courseModel from '../models/course.model.js';

const router = express.Router();

/**
 * Xử lý khi người dùng nhấn nút "Thêm vào giỏ"
 */
router.post('/add', async (req, res) => {
    const courseId = req.body.course_id;

    // Lấy thông tin khóa học (chỉ cần id là đủ, nhưng findById an toàn hơn)
    const course = await courseModel.findById(courseId);
    if (!course) {
        return res.redirect(req.headers.referer || '/');
    }

    // Kiểm tra khóa học đã có trong giỏ chưa
    let isCourseInCart = false;
    for (const item of req.session.cart) {
        // Chuyển đổi id sang string để so sánh an toàn
        if (item.id.toString() === course.id.toString()) {
            isCourseInCart = true;
            break;
        }
    }

    // Nếu chưa có, thêm vào giỏ
    if (!isCourseInCart) {
        req.session.cart.push(course);
    }

    res.redirect(req.headers.referer || '/');
});

/**
 * MỚI: Xử lý khi người dùng nhấn nút "Xóa"
 */
router.post('/remove', (req, res) => {
    const courseIdToRemove = req.body.course_id;

    // Lọc ra mảng mới, bỏ đi khóa học có id trùng
    req.session.cart = req.session.cart.filter(item => {
        return item.id.toString() !== courseIdToRemove;
    });

    // Chuyển hướng người dùng quay lại trang giỏ hàng
    res.redirect('/cart');
});

/**
 * SỬA LẠI: Hiển thị trang giỏ hàng
 */
router.get('/', (req, res) => {
    const cartCourses = req.session.cart || [];

    // SỬA LOGIC TÍNH TỔNG:
    let total = 0;
    for (const course of cartCourses) {
        // 1. Ưu tiên giá sale, nếu không có thì dùng giá gốc
        const priceToSum = course.sale_price || course.price || 0;

        // 2. Chuyển sang SỐ (Number) trước khi cộng
        total += parseFloat(priceToSum);
    }
    // KẾT THÚC SỬA

    res.render('vwCart/list', {
        layout: 'main',
        courses: cartCourses,
        empty: cartCourses.length === 0,
        total: total // 'total' bây giờ là một con số chính xác
    });
});

export default router;