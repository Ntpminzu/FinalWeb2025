import express from 'express';
import * as authApiController from '../controllers/auth.api.controller.js';
import { requireApiUser } from '../middlewares/api-auth.middleware.js';
import { authJsonRequest, refreshCsrf } from '../middlewares/api-browser.middleware.js';
import { apiAuthRateLimiter } from '../../../common/middlewares/security.middleware.js';

const router = express.Router();
router.get('/auth/csrf-token', authApiController.csrfToken);
router.get('/auth/username-availability', apiAuthRateLimiter, authApiController.usernameAvailable);
router.post('/auth/register', apiAuthRateLimiter, authJsonRequest, authApiController.register);
router.post('/auth/login', apiAuthRateLimiter, authJsonRequest, authApiController.login);
router.post('/auth/refresh', refreshCsrf, authApiController.refresh);
router.post('/auth/logout', requireApiUser, authApiController.logout);
router.get('/auth/me', requireApiUser, authApiController.me);
export default router;
