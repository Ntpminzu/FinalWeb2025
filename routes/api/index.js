import express from 'express';
import * as categoryController from '../../controllers/api/category.api.controller.js';
import * as courseController from '../../controllers/api/course.api.controller.js';
import * as healthController from '../../controllers/api/health.api.controller.js';

const router = express.Router();

router.get('/health', healthController.health);
router.get('/categories', categoryController.listCategories);
router.get('/categories/:id/courses', categoryController.listCategoryCourses);
router.get('/courses', courseController.listCourses);
router.get('/courses/:id', courseController.getCourse);

export default router;
