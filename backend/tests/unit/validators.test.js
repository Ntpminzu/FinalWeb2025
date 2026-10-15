import assert from 'node:assert/strict';
import test from 'node:test';
import { ConflictError } from '../../src/common/errors/app-error.js';
import Cart from '../../src/modules/cart/domain/cart.model.js';
import * as cartService from '../../src/modules/cart/services/cart.service.js';
import { signupSchema } from '../../src/modules/auth/schemas/auth.schema.js';
import { checkoutSchema } from '../../src/modules/cart/schemas/cart.schema.js';
import { apiPagination } from '../../src/common/schemas/common.schema.js';
import { courseApiQuerySchema, courseMutationSchema } from '../../src/modules/courses/schemas/course.schema.js';
import { durationSchema, progressSchema } from '../../src/modules/learning/schemas/learning.schema.js';
import { reviewSchema } from '../../src/modules/reviews/schemas/review.schema.js';

test('signup schema normalizes valid input', () => {
  const result = signupSchema({ username: 'junior.dev', password: 'password123', confirm_password: 'password123', name: 'Junior Dev', email: 'JUNIOR@example.com' });
  assert.equal(result.email, 'junior@example.com');
  assert.equal(result.username, 'junior.dev');
});

test('signup schema rejects mismatched password confirmation', () => {
  assert.throws(() => signupSchema({ username: 'junior.dev', password: 'password123', confirm_password: 'different', name: 'Junior Dev', email: 'junior@example.com' }));
});

test('signup schema accepts camelCase confirmation for api clients', () => {
  const result = signupSchema({ username: 'api.dev', password: 'password123', confirmPassword: 'password123', name: 'API Dev', email: 'API@example.com' });
  assert.equal(result.email, 'api@example.com');
});

test('course schema enforces sale price business rule', () => {
  assert.throws(() => courseMutationSchema({ title: 'Node.js', category_id: 1, price: 100, sale_price: 101 }));
  assert.equal(courseMutationSchema({ title: 'Node.js', category_id: 1, price: 100, sale_price: 80 }).sale_price, 80);
});

test('review schema accepts only one to five stars', () => {
  assert.equal(reviewSchema({ rating: 5, comment: 'Good' }).rating, 5);
  assert.throws(() => reviewSchema({ rating: 6, comment: '' }));
});

test('lecture duration is bounded and rounded down', () => {
  assert.equal(durationSchema({ lecture_id: 1, duration_sec: 120.9 }).duration, 120);
  assert.throws(() => durationSchema({ lecture_id: 1, duration_sec: 50000 }));
});

test('cart prevents duplicates and calculates sale prices', () => {
  const cart = new Cart([]);
  cart.addItem({ id: 1, price: 100, sale_price: 80 });
  cart.addItem({ id: 1, price: 100, sale_price: 80 });
  assert.equal(cart.items.length, 1);
  assert.equal(cart.getTotalPrice(), 80);
});

test('progress schema accepts camelCase api fields', () => {
  assert.deepEqual(progressSchema({ lectureId: 2, lastSecond: 120 }), { lectureId: 2, lastSecond: 120 });
});

test('checkout rejects an empty cart', async () => {
  await assert.rejects(() => cartService.checkout(1, []), ConflictError);
});

test('checkout schema requires an idempotency key', () => {
  assert.deepEqual(checkoutSchema({ idempotencyKey: 'abc123', courseIds: [1, '2'] }), { idempotencyKey: 'abc123', courseIds: [1, 2] });
  assert.equal(checkoutSchema({ idempotency_key: 'legacy-key', course_ids: [3] }).idempotencyKey, 'legacy-key');
  assert.throws(() => checkoutSchema({ idempotencyKey: '', courseIds: [1] }));
  assert.throws(() => checkoutSchema({ idempotencyKey: 'abc123', courseIds: [] }));
});

test('api pagination supports client limits but clamps unsafe values', () => {
  assert.deepEqual(apiPagination({ page: '2', limit: '20' }), { page: 2, limit: 20, offset: 20 });
  assert.deepEqual(apiPagination({ page: '-1', limit: '999' }), { page: 1, limit: 50, offset: 0 });
});

test('course api query supports search and rejects unknown sorts', () => {
  assert.equal(courseApiQuerySchema({ q: 'node' }).sort, 'relevance');
  assert.equal(courseApiQuerySchema({ sort: 'rating_desc' }).sort, 'rating_desc');
  assert.equal(courseApiQuerySchema({ categoryId: '3' }).categoryId, 3);
  assert.throws(() => courseApiQuerySchema({ sort: 'random' }));
});

test('signup rejects impossible birthdays and bcrypt-truncated Unicode passwords', () => {
  const base = { username: 'valid', name: 'Valid Name', email: 'valid@example.com', password: 'password123', confirmPassword: 'password123' };
  assert.throws(() => signupSchema({ ...base, dob: '2026-02-30' }));
  const password = 'á'.repeat(40);
  assert.throws(() => signupSchema({ ...base, password, confirmPassword: password }));
});

test('checkout rejects duplicate IDs and cart honors a zero sale price', () => {
  assert.throws(() => checkoutSchema({ idempotencyKey: 'duplicate', courseIds: [1, 1] }));
  assert.equal(new Cart([{ id: 1, price: 100, sale_price: 0 }]).getTotalPrice(), 0);
});
