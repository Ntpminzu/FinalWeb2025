import Cart from '../domain/cart.model.js';
import CourseRepository from '../../courses/repositories/course.repository.js';
import IdempotencyRepository from '../repositories/idempotency.repository.js';
import PurchasedRepository from '../../learning/repositories/purchased.repository.js';
import CartRepository from '../repositories/cart.repository.js';
import { transaction } from '../../../common/database/transaction.js';
import UserRepository from '../../users/repositories/user.repository.js';
import { ConflictError, NotFoundError } from '../../../common/errors/app-error.js';
import { positiveInteger } from '../../../common/schemas/common.schema.js';

export async function addItem(items, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  const course = await CourseRepository.findById(courseId);
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

export async function checkout(userId, items, idempotencyKey = null, requestedCourseIds = [], persistent = false) {
  const cart = new Cart(items || []);
  if (!persistent && !idempotencyKey && !cart.items.length) throw new ConflictError('Giỏ hàng đang trống.');

  return transaction(async connection => {
    await UserRepository.lock(userId, connection);
    const endpoint = 'checkout';
    const fingerprint = idempotencyKey ? checkoutFingerprint(userId, requestedCourseIds) : null;
    if (idempotencyKey) {
      const previous = await IdempotencyRepository.find(userId, endpoint, idempotencyKey, connection);
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

    const currentItems = persistent ? await CartRepository.list(userId, connection) : await CartRepository.findCourses(cart.items.map(item => item.id), connection);
    if (currentItems.some(item => item.is_disabled) || (!persistent && currentItems.length !== cart.items.length)) throw new ConflictError('Giỏ hàng có khóa học không còn khả dụng.');
    cart.items = currentItems;
    if (!cart.items.length) throw new ConflictError('Giỏ hàng đang trống.');
    const cartCourseIds = new Set(cart.items.map(item => Number(item.id)));
    const requestMatchesCart = requestedCourseIds.length === cartCourseIds.size
      && requestedCourseIds.every(courseId => cartCourseIds.has(Number(courseId)));
    if (idempotencyKey && !requestMatchesCart) throw new ConflictError('Danh sách khóa học checkout không khớp với giỏ hàng hiện tại.');

    const owned = new Set((await PurchasedRepository.findOwnedCourseIds(userId, connection)).map(String));
    const alreadyOwned = cart.items.filter(item => owned.has(String(item.id)));
    if (alreadyOwned.length) throw new ConflictError('Giỏ hàng có khóa học bạn đã sở hữu.');
    await PurchasedRepository.addMultiple(userId, cart.items, connection);
    const response = { purchased: cart.items.length };
    if (idempotencyKey) {
      await IdempotencyRepository.save(userId, endpoint, idempotencyKey, fingerprint, 201, response, connection);
    }
    if (persistent) await CartRepository.clear(userId, connection);
    return { ...response, statusCode: 201, reused: false, items: [] };
  });
}

export async function getUserCart(userId) {
  return summarize(await CartRepository.list(userId));
}

export async function addUserItem(userId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  await transaction(async connection => {
    await UserRepository.lock(userId, connection);
    const course = await CourseRepository.findById(courseId, connection);
    if (!course) throw new NotFoundError('Không tìm thấy khóa học.');
    if (await PurchasedRepository.findByUserAndCourse(userId, courseId, connection)) throw new ConflictError('Bạn đã sở hữu khóa học.');
    await CartRepository.add(userId, courseId, connection);
  });
  return getUserCart(userId);
}

export async function removeUserItem(userId, rawCourseId) {
  const courseId = positiveInteger(rawCourseId, 'Khóa học');
  await transaction(async connection => {
    await UserRepository.lock(userId, connection);
    await CartRepository.remove(userId, courseId, connection);
  });
  return getUserCart(userId);
}
export async function clearUserCart(userId) {
  await transaction(async connection => {
    await UserRepository.lock(userId, connection);
    await CartRepository.clear(userId, connection);
  });
  return getUserCart(userId);
}
export const checkoutUserCart = (userId, key, courseIds) => checkout(userId, [], key, courseIds, true);

export async function mergeLegacyCart(userId, items) {
  if (!items?.length) return;
  await transaction(async connection => {
    await UserRepository.lock(userId, connection);
    const courses = await CartRepository.findCourses(items.map(item => item.id), connection);
    const owned = new Set((await PurchasedRepository.findOwnedCourseIds(userId, connection)).map(Number));
    for (const course of courses) if (!course.is_disabled && !owned.has(Number(course.id))) await CartRepository.add(userId, course.id, connection);
  });
}
