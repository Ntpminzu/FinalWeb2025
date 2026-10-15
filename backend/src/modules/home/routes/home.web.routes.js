import express from 'express';
import * as homeController from '../controllers/home.web.controller.js';

const router = express.Router();
router.get('/', homeController.home);
export default router;
