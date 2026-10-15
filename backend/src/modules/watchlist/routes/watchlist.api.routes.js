import express from 'express';
import * as watchlistApiController from '../controllers/watchlist.api.controller.js';
import { requireApiStudent } from '../../auth/middlewares/api-auth.middleware.js';

const router = express.Router();
router.get('/me/watchlist', requireApiStudent, watchlistApiController.watchlist);
router.post('/me/watchlist/items', requireApiStudent, watchlistApiController.addWatchlist);
router.delete('/me/watchlist/items/:courseId', requireApiStudent, watchlistApiController.removeWatchlist);
export default router;
