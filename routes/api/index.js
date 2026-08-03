import express from 'express';
import * as authController from '../../controllers/api/auth.api.controller.js';
import * as cartController from '../../controllers/api/cart.api.controller.js';
import * as categoryController from '../../controllers/api/category.api.controller.js';
import * as courseController from '../../controllers/api/course.api.controller.js';
import * as healthController from '../../controllers/api/health.api.controller.js';
import { requireApiUser } from '../../middlewares/api-auth.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';

const router = express.Router();

router.get('/health', healthController.health);
router.get('/auth/csrf-token', csrfProtection, authController.csrfToken);
router.post('/auth/register', csrfProtection, authController.register);
router.post('/auth/login', csrfProtection, authController.login);
router.post('/auth/logout', csrfProtection, requireApiUser, authController.logout);
router.get('/auth/me', requireApiUser, authController.me);
router.get('/cart', requireApiUser, cartController.getCart);
router.post('/cart/items', csrfProtection, requireApiUser, cartController.addItem);
router.delete('/cart/items/:courseId', csrfProtection, requireApiUser, cartController.removeItem);
router.delete('/cart', csrfProtection, requireApiUser, cartController.clearCart);
router.get('/categories', categoryController.listCategories);
router.get('/categories/:id/courses', categoryController.listCategoryCourses);
router.get('/courses', courseController.listCourses);
router.get('/courses/:id', courseController.getCourse);

export default router;
