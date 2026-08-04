import Cart from '../models/cart.model.js';
import CourseDao from '../daos/course.dao.js';
import IdempotencyDao from '../daos/idempotency.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';
import db from '../utils/db.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import { positiveInteger } from '../validators/common.schema.js';

export async function addItem(items, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const course = await CourseDao.findById(courseId);
  if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
  const cart = new Cart(items || []);
  cart.addItem(course);
  return cart.items;
}

export function removeItem(items, courseId) {
  const cart = new Cart(items || []);
  cart.removeItem(courseId);
  return cart.items;
}

export function summarize(items) {
  const cart = new Cart(items || []);
  return { courses: cart.items, total: cart.getTotalPrice(), empty: cart.items.length === 0 };
}

function checkoutFingerprint(userId, courseIds) {
  const normalizedCourseIds = (courseIds || [])
    .map(Number)
    .filter(Number.isInteger)
    .sort((left, right) => left - right)
    .join(',');
  return `user:${userId}|courses:${normalizedCourseIds}`;
}

export async function checkout(userId, items, idempotencyKey = null, requestedCourseIds = []) {
  const cart = new Cart(items || []);
  if (!idempotencyKey && !cart.items.length) throw new ConflictError('Giỏ hàng đang trống.');

  return db.transaction(async trx => {
    const endpoint = 'checkout';
    const fingerprint = idempotencyKey ? checkoutFingerprint(userId, requestedCourseIds) : null;
    if (idempotencyKey) {
      const previous = await IdempotencyDao.find(userId, endpoint, idempotencyKey, trx);
      if (previous?.request_fingerprint && previous.request_fingerprint !== fingerprint) {
        throw new ConflictError('Idempotency key đã được dùng cho request khác.');
      }
      if (previous) {
        return {
          ...previous.response_body,
          statusCode: Number(previous.status_code),
          reused: true,
          items: null,
        };
      }
    }

    if (!cart.items.length) throw new ConflictError('Giỏ hàng đang trống.');
    const cartCourseIds = new Set(cart.items.map(item => Number(item.id)));
    const requestMatchesCart = requestedCourseIds.length === cartCourseIds.size
      && requestedCourseIds.every(courseId => cartCourseIds.has(Number(courseId)));
    if (!requestMatchesCart) throw new ConflictError('Danh sách khóa học checkout không khớp với giỏ hàng hiện tại.');

    const owned = new Set((await PurchasedDao.findOwnedCourseIds(userId, trx)).map(String));
    const alreadyOwned = cart.items.filter(item => owned.has(String(item.id)));
    if (alreadyOwned.length) throw new ConflictError('Giỏ hàng có khóa học bạn đã sở hữu.');
    await PurchasedDao.addMultiple(userId, cart.items, trx);
    const response = { purchased: cart.items.length };
    if (idempotencyKey) {
      await IdempotencyDao.save(userId, endpoint, idempotencyKey, fingerprint, 201, response, trx);
    }
    return { ...response, statusCode: 201, reused: false, items: [] };
  });
}
