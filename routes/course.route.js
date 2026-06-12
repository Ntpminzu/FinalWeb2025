// routes/course.route.js

import express from 'express';
import * as courseController from '../controllers/course.controller.js';

const router = express.Router();

// Danh sách tất cả khóa học
router.get('/', courseController.listCourses);

// Chi tiết khóa học
router.get('/:id', courseController.showCourseDetail);

export default router;