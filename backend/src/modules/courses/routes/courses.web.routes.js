import express from 'express';
import * as courseController from '../controllers/course.web.controller.js';
import * as searchController from '../controllers/search.web.controller.js';

const router = express.Router();
router.get('/courses', courseController.listCourses);
router.get('/courses/:id', courseController.showCourseDetail);
router.get('/search', searchController.search);
export default router;
