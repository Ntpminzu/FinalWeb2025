import express from 'express';
import * as healthApiController from '../controllers/health.api.controller.js';

const router = express.Router();
router.get('/health', healthApiController.health);
export default router;
