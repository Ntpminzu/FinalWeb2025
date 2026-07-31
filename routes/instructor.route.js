// routes/instructor.route.js

import express from 'express';
import { restrictInstructor } from '../middlewares/auth.mdw.js';
import * as instructorController from '../controllers/instructor.controller.js';

const router = express.Router();

router.use(restrictInstructor);

// Redirect
router.get('/', instructorController.redirectToDashboard);

// Dashboard
router.get('/dashboard', instructorController.dashboard);

// Tạo khóa học mới
router.get('/new', instructorController.showNewForm);
router.post('/new', instructorController.upload.single('thumbnail'), instructorController.createCourse);

// Chỉnh sửa khóa học
router.get('/edit/course/:id', instructorController.showEditCourse);
router.post('/edit/:id', instructorController.requireOwnedCourse, instructorController.upload.single('thumbnail'), instructorController.updateCourse);

// Quản lý bài giảng
router.get('/edit/lectures/:id', instructorController.showEditLectures);
router.post('/lectures/:courseId/add', instructorController.addLecture);
router.post('/lectures/:lectureId/delete', instructorController.deleteLecture);

// Hồ sơ giảng viên
router.get('/profile', instructorController.showProfile);
router.get('/profile/edit', instructorController.showEditProfile);
router.post('/profile/edit', instructorController.updateProfile);

// Toggle trạng thái khóa học
router.post('/courses/toggle/:id', instructorController.toggleCourseStatus);

export default router;
