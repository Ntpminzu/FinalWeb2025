import express from 'express';
import * as cartApiController from '../controllers/cart.api.controller.js';
import { requireApiStudent } from '../../auth/middlewares/api-auth.middleware.js';

const router = express.Router();
router.get('/cart', requireApiStudent, cartApiController.getCart);
router.post('/cart/items', requireApiStudent, cartApiController.addItem);
router.delete('/cart/items/:courseId', requireApiStudent, cartApiController.removeItem);
router.delete('/cart', requireApiStudent, cartApiController.clearCart);
router.post('/checkout', requireApiStudent, cartApiController.checkout);
export default router;
