import express from 'express';
import * as adminApiController from '../controllers/admin.api.controller.js';
import { requireApiAdmin } from '../../auth/middlewares/api-auth.middleware.js';

const router = express.Router();
router.use('/admin', requireApiAdmin);
router.get('/admin/dashboard', adminApiController.dashboard);
router.get('/admin/users', adminApiController.users);
router.patch('/admin/users/:userId/role', adminApiController.promote);
router.patch('/admin/users/:userId/status', adminApiController.userStatus);
router.delete('/admin/users/:userId', adminApiController.removeUser);
router.get('/admin/courses', adminApiController.courses);
router.patch('/admin/courses/:courseId/status', adminApiController.courseStatus);
router.delete('/admin/courses/:courseId', adminApiController.removeCourse);
router.get('/admin/categories', adminApiController.categories);
router.post('/admin/categories', adminApiController.addCategory);
router.patch('/admin/categories/:categoryId', adminApiController.updateCategory);
router.delete('/admin/categories/:categoryId', adminApiController.removeCategory);
export default router;
