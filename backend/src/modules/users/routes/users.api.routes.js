import express from 'express';
import * as userApiController from '../controllers/user.api.controller.js';
import { requireApiUser } from '../../auth/middlewares/api-auth.middleware.js';

const router = express.Router();
router.patch('/me/profile', requireApiUser, userApiController.profile);
router.patch('/me/password', requireApiUser, userApiController.password);
export default router;
