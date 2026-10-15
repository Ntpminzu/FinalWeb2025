import express from 'express';
import * as categoryApiController from '../controllers/category.api.controller.js';

const router = express.Router();
router.get('/categories', categoryApiController.listCategories);
router.get('/categories/:id/courses', categoryApiController.listCategoryCourses);
export default router;
