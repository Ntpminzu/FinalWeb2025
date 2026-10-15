import * as cartService from '../services/cart.service.js';
import { safeReferrer } from '../../../common/utils/safe-redirect.js';
import Permission from '../../../common/enums/Permission.js';

const studentId = req => req.session.isAuthenticated && Number(req.session.authUser?.permission) === Permission.STUDENT ? req.session.authUser.id : null;

export async function addToCart(req, res, next) {
  try {
    if (studentId(req)) await cartService.addUserItem(studentId(req), req.body.course_id);
    else req.session.cart = await cartService.addItem(req.session.cart, req.body.course_id);
    return res.redirect(safeReferrer(req));
  } catch (error) { return next(error); }
}

export async function removeFromCart(req, res, next) {
  try {
    if (studentId(req)) await cartService.removeUserItem(studentId(req), req.body.course_id);
    else req.session.cart = cartService.removeItem(req.session.cart, req.body.course_id);
    return res.redirect('/cart');
  } catch (error) { return next(error); }
}

export const getTotalPrice = courses => cartService.summarize(courses).total;

export async function showCart(req, res, next) {
  try {
    const summary = studentId(req) ? await cartService.getUserCart(studentId(req)) : cartService.summarize(req.session.cart);
    return res.render('vwCart/list', { layout: 'main', ...summary });
  } catch (error) { return next(error); }
}

export function clearCart(req) { req.session.cart = []; }

export async function checkout(req, res, next) {
  try {
    const result = await cartService.checkoutUserCart(req.session.authUser.id);
    req.session.cart = result.items;
    return res.redirect('/student/courses');
  } catch (error) { return next(error); }
}
