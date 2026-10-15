import express from 'express';
import * as adminController from '../controllers/admin.web.controller.js';
import { restrictAdmin } from '../../auth/middlewares/auth.mdw.js';

const router = express.Router();
router.get('/admin', restrictAdmin, adminController.dashboard);
router.get('/admin/users', restrictAdmin, adminController.listUsers);
router.post('/admin/users/make-teacher/:id', restrictAdmin, adminController.makeTeacher);
router.post('/admin/users/disable/:id', restrictAdmin, adminController.disableUser);
router.post('/admin/users/delete/:id', restrictAdmin, adminController.deleteUser);
router.get('/admin/courses', restrictAdmin, adminController.listCourses);
router.post('/admin/courses/delete/:id', restrictAdmin, adminController.deleteCourse);
router.post('/admin/courses/disable/:id', restrictAdmin, adminController.disableCourse);
router.get('/admin/categories', restrictAdmin, adminController.listCategories);
router.post('/admin/categories/add', restrictAdmin, adminController.addCategory);
router.post('/admin/categories/edit', restrictAdmin, adminController.editCategory);
router.post('/admin/categories/delete', restrictAdmin, adminController.deleteCategory);
export default router;
