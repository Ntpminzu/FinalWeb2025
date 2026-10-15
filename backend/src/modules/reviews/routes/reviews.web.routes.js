import express from 'express';
import { restrictStudent } from '../../auth/middlewares/auth.mdw.js';
import * as reviewController from '../controllers/review.web.controller.js';

const router = express.Router();
router.get('/student/course/:courseId/feedback', restrictStudent, reviewController.checkReviewStatus);
router.post('/student/course/:courseId/feedback', restrictStudent, reviewController.submitReview);
export default router;
