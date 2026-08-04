import * as cartService from '../../services/cart.service.js';
import { created, ok } from '../../utils/api-response.js';
import { checkoutSchema } from '../../validators/cart.schema.js';
import { courseDto } from './course.api.controller.js';

function cartDto(summary) {
  return {
    courses: summary.courses.map(courseDto),
    total: Number(summary.total || 0),
    empty: Boolean(summary.empty),
  };
}

export function getCart(req, res) {
  return ok(res, cartDto(cartService.summarize(req.session.cart)));
}

export async function addItem(req, res, next) {
  try {
    const courseId = req.body?.courseId ?? req.body?.course_id;
    req.session.cart = await cartService.addItem(req.session.cart, courseId);
    return ok(res, cartDto(cartService.summarize(req.session.cart)));
  } catch (error) {
    return next(error);
  }
}

export function removeItem(req, res, next) {
  try {
    req.session.cart = cartService.removeItem(req.session.cart, req.params.courseId);
    return ok(res, cartDto(cartService.summarize(req.session.cart)));
  } catch (error) {
    return next(error);
  }
}

export function clearCart(req, res) {
  req.session.cart = [];
  return ok(res, cartDto(cartService.summarize(req.session.cart)));
}

export async function checkout(req, res, next) {
  try {
    const { idempotencyKey, courseIds } = checkoutSchema(req.body);
    const result = await cartService.checkout(req.user.id, req.session.cart, idempotencyKey, courseIds);
    if (Array.isArray(result.items)) req.session.cart = result.items;
    const response = {
      purchased: result.purchased,
      cart: cartDto(cartService.summarize(req.session.cart)),
    };
    if (result.reused) return ok(res, { ...response, reused: true });
    return created(res, { ...response, reused: false });
  } catch (error) {
    return next(error);
  }
}
