import express from 'express';
import * as authController from '../../controllers/api/auth.api.controller.js';
import * as cartController from '../../controllers/api/cart.api.controller.js';
import * as categoryController from '../../controllers/api/category.api.controller.js';
import * as courseController from '../../controllers/api/course.api.controller.js';
import * as healthController from '../../controllers/api/health.api.controller.js';
import * as reviewController from '../../controllers/api/review.api.controller.js';
import * as studentController from '../../controllers/api/student.api.controller.js';
import { requireApiStudent, requireApiUser } from '../../middlewares/api-auth.middleware.js';
import { csrfProtection } from '../../middlewares/csrf.middleware.js';

const router = express.Router();

router.get('/health', healthController.health);
router.get('/auth/csrf-token', csrfProtection, authController.csrfToken);
router.post('/auth/register', csrfProtection, authController.register);
router.post('/auth/login', csrfProtection, authController.login);
router.post('/auth/logout', csrfProtection, requireApiUser, authController.logout);
router.get('/auth/me', requireApiUser, authController.me);
router.get('/me/courses', requireApiStudent, studentController.myCourses);
router.get('/me/courses/:courseId/progress', requireApiStudent, studentController.courseProgress);
router.patch('/me/lectures/:lectureId/progress', csrfProtection, requireApiStudent, studentController.saveProgress);
router.get('/cart', requireApiStudent, cartController.getCart);
router.post('/cart/items', csrfProtection, requireApiStudent, cartController.addItem);
router.delete('/cart/items/:courseId', csrfProtection, requireApiStudent, cartController.removeItem);
router.delete('/cart', csrfProtection, requireApiStudent, cartController.clearCart);
router.post('/checkout', csrfProtection, requireApiStudent, cartController.checkout);
router.get('/categories', categoryController.listCategories);
router.get('/categories/:id/courses', categoryController.listCategoryCourses);
router.get('/courses', courseController.listCourses);
router.get('/courses/:id', courseController.getCourse);
router.post('/courses/:courseId/reviews', csrfProtection, requireApiStudent, reviewController.submitReview);
router.patch('/courses/:courseId/reviews/me', csrfProtection, requireApiStudent, reviewController.updateMyReview);

router.use((req, res) => res.status(404).json({
  error: {
    code: 'NOT_FOUND',
    message: 'Không tìm thấy tài nguyên.',
    status: 404,
  },
}));

export default router;
