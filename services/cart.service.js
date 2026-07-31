import Cart from '../models/cart.model.js';
import CourseDao from '../daos/course.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';
import { NotFoundError } from '../errors/app-error.js';
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

export async function checkout(userId, items) {
  const cart = new Cart(items || []);
  if (!cart.items.length) return { purchased: 0, items: [] };
  const owned = new Set((await PurchasedDao.findOwnedCourseIds(userId)).map(String));
  const toBuy = cart.items.filter(item => !owned.has(String(item.id)));
  await PurchasedDao.addMultiple(userId, toBuy);
  return { purchased: toBuy.length, items: [] };
}
