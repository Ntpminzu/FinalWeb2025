import express from 'express';
import * as cartController from '../controllers/cart.web.controller.js';
import { restrictStudent } from '../../auth/middlewares/auth.mdw.js';

const router = express.Router();
router.post('/cart/add', cartController.addToCart);
router.post('/cart/remove', cartController.removeFromCart);
router.get('/cart', cartController.showCart);
router.post('/cart/checkout', restrictStudent, cartController.checkout);
export default router;
