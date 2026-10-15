import express from 'express';
import { ValidationError } from '../common/errors/app-error.js';
import healthRouter from '../common/routes/health.api.routes.js';
import homeRouter from '../modules/home/routes/home.api.routes.js';
import authRouter from '../modules/auth/routes/auth.api.routes.js';
import categoriesRouter from '../modules/categories/routes/categories.api.routes.js';
import coursesRouter from '../modules/courses/routes/courses.api.routes.js';
import reviewsRouter from '../modules/reviews/routes/reviews.api.routes.js';
import usersRouter from '../modules/users/routes/users.api.routes.js';
import watchlistRouter from '../modules/watchlist/routes/watchlist.api.routes.js';
import learningRouter from '../modules/learning/routes/learning.api.routes.js';
import cartRouter from '../modules/cart/routes/cart.api.routes.js';
import instructorRouter from '../modules/instructor/routes/instructor.api.routes.js';
import adminRouter from '../modules/admin/routes/admin.api.routes.js';

import chatbotRouter from '../modules/chatbot/routes/chatbot.api.routes.js';

const router = express.Router();
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.body === undefined) req.body = {};
  if (req.body === null || Array.isArray(req.body) || typeof req.body !== 'object') return next(new ValidationError('Body phải là một JSON object.'));
  return next();
});

router.use(healthRouter);
router.use(chatbotRouter);
router.use(homeRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(coursesRouter);
router.use(reviewsRouter);
router.use(usersRouter);
router.use(watchlistRouter);
router.use(learningRouter);
router.use(cartRouter);
router.use(instructorRouter);
router.use(adminRouter);

router.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy tài nguyên.', status: 404 } }));
export default router;
