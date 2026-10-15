import express from 'express';
import * as courseApiController from '../controllers/course.api.controller.js';

const router = express.Router();
router.get('/courses', courseApiController.listCourses);
router.get('/courses/:id', courseApiController.getCourse);
export default router;
