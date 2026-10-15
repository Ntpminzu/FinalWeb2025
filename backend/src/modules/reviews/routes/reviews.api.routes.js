import express from 'express';
import * as reviewApiController from '../controllers/review.api.controller.js';
import { requireApiStudent } from '../../auth/middlewares/api-auth.middleware.js';

const router = express.Router();
router.get('/courses/:courseId/reviews/me', requireApiStudent, reviewApiController.myReview);
router.post('/courses/:courseId/reviews', requireApiStudent, reviewApiController.submitReview);
router.patch('/courses/:courseId/reviews/me', requireApiStudent, reviewApiController.updateMyReview);
export default router;
