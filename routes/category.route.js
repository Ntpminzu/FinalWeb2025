import express from 'express';
import * as categoryModel from '../models/category.model.js';
import * as courseModel from '../models/course.model.js';
const router = express.Router();

const COURSES_PER_PAGE = 9; // (Bạn có thể đổi số này)

// ... (router.get('/') của bạn giữ nguyên) ...

// === SỬA LẠI TOÀN BỘ ROUTE NÀY ===
router.get('/:id', async function (req, res, next) {
    const parentCategoryId = parseInt(req.params.id, 10);

    try {
        const category = await categoryModel.findById(parentCategoryId);
        if (!category) {
            return res.status(404).render('404');
        }

        const childIds = await categoryModel.findChildIds(parentCategoryId);
        const allCategoryIds = [parentCategoryId, ...childIds];

        // Logic phân trang
        const page = parseInt(req.query.page || 1, 10);
        const limit = COURSES_PER_PAGE;
        const offset = (page - 1) * limit;

        // Gọi 2 hàm model (đếm và lấy)
        const [courses, totalCourses] = await Promise.all([
            courseModel.findPageByCategoryIds(allCategoryIds, limit, offset),
            courseModel.countByCategoryIds(allCategoryIds)
        ]);

        const totalPages = Math.ceil(totalCourses / limit);

        res.render('vwCourse/byCategory', {
            layout: 'main',
            category: category,
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
        next(err);
    }
});

export default router;