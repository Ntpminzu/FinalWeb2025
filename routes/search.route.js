// routes/search.route.js

import express from 'express';
import * as searchController from '../controllers/search.controller.js';

const router = express.Router();

// Tìm kiếm khóa học (FTS)
router.get('/', searchController.search);

export default router;