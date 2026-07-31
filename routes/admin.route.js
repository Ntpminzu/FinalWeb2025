// routes/admin.route.js

import express from 'express';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

// Dashboard
router.get('/', adminController.dashboard);

// Quản lý người dùng
router.get('/users', adminController.listUsers);
router.post('/users/make-teacher/:id', adminController.makeTeacher);
router.post('/users/disable/:id', adminController.disableUser);
router.post('/users/delete/:id', adminController.deleteUser);

// Quản lý khóa học
router.get('/courses', adminController.listCourses);
router.post('/courses/delete/:id', adminController.deleteCourse);
router.post('/courses/disable/:id', adminController.disableCourse);

// Quản lý danh mục
router.get('/categories', adminController.listCategories);
router.post('/categories/add', adminController.addCategory);
router.post('/categories/edit', adminController.editCategory);
router.post('/categories/delete', adminController.deleteCategory);

// Hồ sơ admin
router.get('/profile', adminController.showProfile);
router.post('/profile', adminController.updateProfile);
router.post('/change-pwd', adminController.changePwd);

export default router;
