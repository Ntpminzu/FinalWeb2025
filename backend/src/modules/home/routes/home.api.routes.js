import express from 'express';
import * as homeApiController from '../controllers/home.api.controller.js';

const router = express.Router();
router.get('/home', homeApiController.home);
export default router;
