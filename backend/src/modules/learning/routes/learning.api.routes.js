import express from 'express';
import * as studentApiController from '../controllers/student.api.controller.js';
import { requireApiStudent } from '../../auth/middlewares/api-auth.middleware.js';

const router = express.Router();
router.get('/me/courses', requireApiStudent, studentApiController.myCourses);
router.get('/me/courses/:courseId/progress', requireApiStudent, studentApiController.courseProgress);
router.get('/me/courses/:courseId/lectures/:lectureId', requireApiStudent, studentApiController.lectureDetail);
router.patch('/me/lectures/:lectureId/progress', requireApiStudent, studentApiController.saveProgress);
router.patch('/me/lectures/:lectureId/duration', requireApiStudent, studentApiController.duration);
export default router;
