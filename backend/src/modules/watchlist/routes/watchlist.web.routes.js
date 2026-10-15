import express from 'express';
import { restrictStudent } from '../../auth/middlewares/auth.mdw.js';
import * as watchlistController from '../controllers/watchlist.web.controller.js';

const router = express.Router();
router.get('/student/watchlist', restrictStudent, watchlistController.showWatchlist);
router.post('/student/watchlist/add', restrictStudent, watchlistController.addToWatchlist);
router.post('/student/watchlist/remove', restrictStudent, watchlistController.removeFromWatchlist);
export default router;
