import { ValidationError } from '../errors/app-error.js';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

export function positiveInteger(value, field = 'id') {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ValidationError(`${field} không hợp lệ.`);
  }
  return number;
}

export function pagination(query, defaultLimit = 9) {
  const requestedPage = Number.parseInt(query?.page || '1', 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  return { page, limit: defaultLimit, offset: (page - 1) * defaultLimit };
}

export function apiPagination(query, defaultLimit = 12, maxLimit = 50) {
  const requestedPage = Number.parseInt(query?.page || '1', 10);
  const requestedLimit = Number.parseInt(query?.limit || String(defaultLimit), 10);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const safeLimit = Number.isInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : defaultLimit;
  const limit = Math.min(safeLimit, maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}

export function profileSchema(input) {
  const name = String(input?.name || '').trim();
  const email = String(input?.email || '').trim().toLowerCase();
  if (name.length < 2 || name.length > 100 || !EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new ValidationError('Thông tin hồ sơ không hợp lệ.');
  }
  return { name, email };
}
