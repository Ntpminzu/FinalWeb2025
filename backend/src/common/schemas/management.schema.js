import { ValidationError } from '../errors/app-error.js';
import { apiPagination, positiveInteger } from './common.schema.js';

export function managementQuery(query = {}) {
  const permission = query.permission === undefined ? null : positiveInteger(query.permission, 'Quyền');
  if (permission !== null && ![1, 2, 3].includes(permission)) throw new ValidationError('Quyền không hợp lệ.');
  let disabled = null;
  if (query.disabled !== undefined) {
    if (!['true', 'false'].includes(query.disabled)) throw new ValidationError('disabled không hợp lệ.');
    disabled = query.disabled === 'true';
  }
  return { ...apiPagination(query), q: String(query.q || '').trim().slice(0, 200), permission, disabled, categoryId: query.categoryId === undefined ? null : positiveInteger(query.categoryId, 'Lĩnh vực') };
}

export function booleanField(value, field) {
  if (typeof value !== 'boolean') throw new ValidationError(`${field} phải là boolean.`);
  return value;
}
