import assert from 'node:assert/strict';
import test from 'node:test';
import Cart from '../../models/cart.model.js';
import { signupSchema } from '../../validators/account.schema.js';
import { courseMutationSchema, durationSchema, reviewSchema } from '../../validators/course.schema.js';

test('signup schema normalizes valid input', () => {
  const result = signupSchema({ username: 'junior.dev', password: 'password123', confirm_password: 'password123', name: 'Junior Dev', email: 'JUNIOR@example.com' });
  assert.equal(result.email, 'junior@example.com');
  assert.equal(result.username, 'junior.dev');
});

test('signup schema rejects mismatched password confirmation', () => {
  assert.throws(() => signupSchema({ username: 'junior.dev', password: 'password123', confirm_password: 'different', name: 'Junior Dev', email: 'junior@example.com' }));
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
