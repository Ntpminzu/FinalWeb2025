import * as cartService from '../services/cart.service.js';
import { created, ok } from '../../../common/utils/api-response.js';
import { checkoutSchema } from '../schemas/cart.schema.js';
import { cartDto } from '../dto/cart.dto.js';

export async function getCart(req, res, next) {
  try { return ok(res, cartDto(await cartService.getUserCart(req.user.id))); }
  catch (error) { return next(error); }
}
export async function addItem(req, res, next) {
  try { return ok(res, cartDto(await cartService.addUserItem(req.user.id, req.body.courseId))); }
  catch (error) { return next(error); }
}
export async function removeItem(req, res, next) {
  try { return ok(res, cartDto(await cartService.removeUserItem(req.user.id, req.params.courseId))); }
  catch (error) { return next(error); }
}
export async function clearCart(req, res, next) {
  try { return ok(res, cartDto(await cartService.clearUserCart(req.user.id))); }
  catch (error) { return next(error); }
}
export async function checkout(req, res, next) {
  try {
    const { idempotencyKey, courseIds } = checkoutSchema(req.body);
    const result = await cartService.checkoutUserCart(req.user.id, idempotencyKey, courseIds);
    const data = { purchased: result.purchased, reused: result.reused, cart: cartDto(await cartService.getUserCart(req.user.id)) };
    return (result.reused ? ok : created)(res, data);
  } catch (error) { return next(error); }
}
