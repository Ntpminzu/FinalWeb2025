import express from 'express';
import * as courseController from '../../controllers/api/course.api.controller.js';
import * as healthController from '../../controllers/api/health.api.controller.js';

const router = express.Router();

router.get('/health', healthController.health);
router.get('/courses', courseController.listCourses);
router.get('/courses/:id', courseController.getCourse);

export default router;
