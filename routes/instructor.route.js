// routes/instructor.route.js

import express from 'express';
import { restrictInstructor } from '../middlewares/auth.mdw.js';
import * as instructorController from '../controllers/instructor.controller.js';

const router = express.Router();

// Redirect
router.get('/', instructorController.redirectToDashboard);

// Dashboard
router.get('/dashboard', restrictInstructor, instructorController.dashboard);

// Tạo khóa học mới
router.get('/new', restrictInstructor, instructorController.showNewForm);
router.post('/new', restrictInstructor, instructorController.upload.single('thumbnail'), instructorController.createCourse);

// Chỉnh sửa khóa học
router.get('/edit/course/:id', restrictInstructor, instructorController.showEditCourse);
router.post('/edit/:id', restrictInstructor, instructorController.upload.single('thumbnail'), instructorController.updateCourse);

// Quản lý bài giảng
router.get('/edit/lectures/:id', restrictInstructor, instructorController.showEditLectures);
router.post('/lectures/:courseId/add', restrictInstructor, instructorController.addLecture);
router.post('/lectures/:lectureId/delete', restrictInstructor, instructorController.deleteLecture);

// Hồ sơ giảng viên
router.get('/profile', restrictInstructor, instructorController.showProfile);
router.get('/profile/edit', restrictInstructor, instructorController.showEditProfile);
router.post('/profile/edit', restrictInstructor, instructorController.updateProfile);

// Toggle trạng thái khóa học
router.post('/courses/toggle/:id', restrictInstructor, instructorController.toggleCourseStatus);

export default router;