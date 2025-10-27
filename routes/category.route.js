import express from 'express';
import * as categoryModel from '../models/category.model.js';
import * as courseModel from '../models/course.model.js';
const router = express.Router();


router.get('/', async function (req, res) {
    try {
        const categories = await categoryModel.all();
        res.render('vwCategory/list', {
            categories,
            empty: categories.length === 0
        });
    } catch (err) {
        console.error(err);
        res.render('vwCategory/list', {
            error: 'Không thể tải danh sách lĩnh vực.'
        });
    }
});


router.get('/:id', async function (req, res, next) { // Thêm 'next'
    const parentCategoryId = parseInt(req.params.id, 10); // Lấy ID từ URL (ví dụ: 1 cho "IT")

    try {
        // 1. Lấy thông tin của danh mục cha (để lấy tên, ví dụ: "IT")
        const category = await categoryModel.findById(parentCategoryId);

        if (!category) {
            return res.status(404).render('404');
        }

        // 2. Tìm tất cả ID con (ví dụ: [9, 10])
        const childIds = await categoryModel.findChildIds(parentCategoryId);

        // 3. Tạo một mảng chứa TẤT CẢ các ID cần tìm (Cha + Con)
        // Ví dụ: [1, 9, 10]
        const allCategoryIds = [parentCategoryId, ...childIds];

        // 4. Tìm tất cả khóa học thuộc mảng ID này
        const courses = await courseModel.findByCategoryIds(allCategoryIds);

        // 5. Render như cũ
        res.render('vwCourse/byCategory', {
            layout: 'main',
            category: category, // Vẫn là category cha (ví dụ: "IT")
            courses: courses,
            empty: courses.length === 0
        });

    } catch (err) {
        console.error(err);
        next(err); // Dùng next(err) thay vì res.status(500)
    }
});
export default router;
