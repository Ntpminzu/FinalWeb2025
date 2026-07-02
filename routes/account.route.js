// routes/account.route.js

import express from 'express';
import { restrict } from '../middlewares/auth.mdw.js';
import * as accountController from '../controllers/account.controller.js';

const router = express.Router();

// Sign Up
router.get('/signup', accountController.showSignup);
router.post('/signup', accountController.doSignup);

// Check username available
router.get('/is-available', accountController.checkAvailable);

// Sign In
router.get('/signin', accountController.showSignin);
router.post('/signin', accountController.doSignin);

// Sign Out
router.post('/logout', accountController.doLogout);
router.post('/signout', accountController.doSignout);

// Profile
router.get('/profile', restrict, accountController.showProfile);
router.post('/profile', restrict, accountController.updateProfile);

// Change Password
router.get('/change-pwd', restrict, accountController.showChangePwd);
router.post('/change-pwd', restrict, accountController.doChangePwd);

export default router;
