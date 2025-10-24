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


router.get('/:id', async function (req, res) {
    const categoryId = req.params.id;

    try {
        const category = await categoryModel.findById(categoryId);

        if (!category) {

            return res.status(404).render('404');
        }

        const courses = await courseModel.findByCategoryId(categoryId);

        res.render('vwCourse/byCategory', {
            layout: 'main',
            category: category,
            courses: courses,
            empty: courses.length === 0
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
    }
});
export default router;
