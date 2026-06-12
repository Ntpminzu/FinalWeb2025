// routes/category.route.js

import express from 'express';
import * as categoryController from '../controllers/category.controller.js';

const router = express.Router();

// Hiển thị courses theo category
router.get('/:id', categoryController.showByCategory);

export default router;