// routes/student.route.js

import express from 'express';
import { restrict } from '../middlewares/auth.mdw.js';
import * as studentController from '../controllers/student.controller.js';
import * as lectureController from '../controllers/lecture.controller.js';
import * as reviewController from '../controllers/review.controller.js';

const router = express.Router();

/** Chỉ cho phép student (permission = 1) */
function ensureStudent(req, res, next) {
  if (!req.session?.authUser || Number(req.session.authUser.permission) !== 1) {
    return res.status(403).send('Forbidden: Students only.');
  }
  next();
}

// Áp dụng middleware cho toàn bộ /student
router.use(restrict, ensureStudent);

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
router.get('/courses/:courseId', restrict, lectureController.showCourseLectures);
router.get('/courses/:courseId/:lectureId', restrict, lectureController.getLecture);

// API tiến trình
router.post('/api/progress', restrict, lectureController.saveProgress);
router.post('/api/lecture-duration', restrict, lectureController.saveLectureDuration);

// Đánh giá khoá học
router.get('/course/:courseId/feedback', restrict, ensureStudent, reviewController.checkReviewStatus);
router.post('/course/:courseId/feedback', restrict, ensureStudent, reviewController.submitReview);

export default router;
