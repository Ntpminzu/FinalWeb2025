import express from 'express';
import * as courseModel from '../models/course.model.js';

const router = express.Router();

// Xử lý GET /search?q=...
router.get('/', async (req, res) => {
    try {
        const query = req.query.q || ''; // Lấy từ khóa 'q' từ URL
        const sortOption = req.query.sort || 'default';
        // Gọi hàm model mới
        const courses = await courseModel.searchByFTS(query, sortOption);

        // Render ra view mới
        res.render('vwCourse/search', {
            layout: 'main',
            query: query,
            courses: courses,
            empty: courses.length === 0,
            sort: sortOption
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi server');
    }
});

export default router;