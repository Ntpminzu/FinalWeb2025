// routes/student.route.js

import express from 'express';
import { restrictStudent } from '../middlewares/auth.mdw.js';
import * as studentController from '../controllers/student.controller.js';
import * as lectureController from '../controllers/lecture.controller.js';
import * as reviewController from '../controllers/review.controller.js';

const router = express.Router();

// Áp dụng middleware cho toàn bộ /student
router.use(restrictStudent);

// Student Home
router.get('/', studentController.home);

// Profile
router.get('/profile', studentController.showProfile);
router.post('/profile', studentController.updateProfile);
router.post('/change-pwd', studentController.changePwd);

// Watchlist
router.get('/watchlist', studentController.showWatchlist);
router.post('/watchlist/add', studentController.addToWatchlist);
router.post('/watchlist/remove', studentController.removeFromWatchlist);

// Purchased Courses
router.get('/courses', studentController.showPurchasedCourses);
router.get('/courses/:courseId', lectureController.showCourseLectures);
router.get('/courses/:courseId/:lectureId', lectureController.getLecture);

// API tiến trình
router.post('/api/progress', lectureController.saveProgress);
router.post('/api/lecture-duration', lectureController.saveLectureDuration);

// Đánh giá khoá học
router.get('/course/:courseId/feedback', reviewController.checkReviewStatus);
router.post('/course/:courseId/feedback', reviewController.submitReview);

export default router;
