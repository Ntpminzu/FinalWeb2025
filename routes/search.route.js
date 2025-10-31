import express from 'express';
import * as courseModel from '../models/course.model.js';

const router = express.Router();
const COURSES_PER_PAGE = 8;

router.get('/', async (req, res, next) => {
    try {
        const query = req.query.q || '';
        const sortOption = req.query.sort || 'default';
        const page = parseInt(req.query.page || 1, 10);
        const limit = COURSES_PER_PAGE;
        const offset = (page - 1) * limit;

        const [courses, totalCourses] = await Promise.all([
            courseModel.findPageByFTS(query, sortOption, limit, offset),
            courseModel.countByFTS(query)
        ]);

        const totalPages = Math.ceil(totalCourses / limit);

        // +++ THÊM DÒNG NÀY: Tạo chuỗi query string +++
        const queryString = `q=${query}&sort=${sortOption}`;

        res.render('vwCourse/search', {
            layout: 'main',
            query: query,
            sort: sortOption,
            courses: courses,
            empty: courses.length === 0,
            pagination: {
                totalPages: totalPages,
                currentPage: page,
                queryString: queryString // <-- Truyền chuỗi query
            }
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
});

export default router;