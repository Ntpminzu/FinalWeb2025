import * as cartService from '../services/cart.service.js';
import { safeReferrer } from '../utils/safe-redirect.js';

export async function addToCart(req, res, next) {
  try {
    req.session.cart = await cartService.addItem(req.session.cart, req.body.course_id);
    return res.redirect(safeReferrer(req));
  } catch (error) { return next(error); }
}

export function removeFromCart(req, res) {
  req.session.cart = cartService.removeItem(req.session.cart, req.body.course_id);
  return res.redirect('/cart');
}

export const getTotalPrice = courses => cartService.summarize(courses).total;

export function showCart(req, res) {
  return res.render('vwCart/list', { layout: 'main', ...cartService.summarize(req.session.cart) });
}

export function clearCart(req) { req.session.cart = []; }

export async function checkout(req, res, next) {
  try {
    const result = await cartService.checkout(req.session.authUser.id, req.session.cart);
    req.session.cart = result.items;
    return res.redirect('/student/courses');
  } catch (error) { return next(error); }
}
