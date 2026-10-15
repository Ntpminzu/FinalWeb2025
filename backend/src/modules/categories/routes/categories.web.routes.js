import express from 'express';
import * as categoryController from '../controllers/category.web.controller.js';

const router = express.Router();
router.get('/categories/:id', categoryController.showByCategory);
export default router;
