import { ValidationError } from '../errors/app-error.js';

export function checkoutSchema(input) {
  const idempotencyKey = String(input?.idempotencyKey || input?.idempotency_key || '').trim();
  if (!idempotencyKey || idempotencyKey.length > 100) {
    throw new ValidationError('Idempotency key không hợp lệ.');
  }
  const rawCourseIds = input?.courseIds || input?.course_ids;
  if (!Array.isArray(rawCourseIds) || rawCourseIds.length === 0) {
    throw new ValidationError('Danh sách khóa học checkout không hợp lệ.');
  }
  const courseIds = rawCourseIds.map(value => Number(value));
  if (courseIds.some(value => !Number.isInteger(value) || value <= 0)) {
    throw new ValidationError('Danh sách khóa học checkout không hợp lệ.');
  }
  return { idempotencyKey, courseIds };
}
