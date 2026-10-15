import express from 'express';
import * as accountController from '../controllers/auth.web.controller.js';

const router = express.Router();
router.get('/account/signup', accountController.showSignup);
router.post('/account/signup', accountController.doSignup);
router.get('/account/is-available', accountController.checkAvailable);
router.get('/account/signin', accountController.showSignin);
router.post('/account/signin', accountController.doSignin);
router.post('/account/logout', accountController.doLogout);
router.post('/account/signout', accountController.doSignout);
export default router;
