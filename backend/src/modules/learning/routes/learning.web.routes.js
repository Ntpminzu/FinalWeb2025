import express from 'express';
import { restrictStudent } from '../../auth/middlewares/auth.mdw.js';
import * as purchasedController from '../controllers/purchased.web.controller.js';
import * as lectureController from '../controllers/lecture.web.controller.js';

const router = express.Router();
router.get('/student/courses', restrictStudent, purchasedController.showPurchasedCourses);
router.get('/student/courses/:courseId', restrictStudent, lectureController.showCourseLectures);
router.get('/student/courses/:courseId/:lectureId', restrictStudent, lectureController.getLecture);
router.post('/student/api/progress', restrictStudent, lectureController.saveProgress);
router.post('/student/api/lecture-duration', restrictStudent, lectureController.saveLectureDuration);
export default router;
