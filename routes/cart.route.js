// routes/cart.route.js

import express from 'express';
import * as cartController from '../controllers/cart.controller.js';

const router = express.Router();

// Thêm vào giỏ
router.post('/add', cartController.addToCart);

// Xóa khỏi giỏ
router.post('/remove', cartController.removeFromCart);

// Trang giỏ hàng
router.get('/', cartController.showCart);

// Thanh toán
router.post('/checkout', cartController.checkout);

export default router;
