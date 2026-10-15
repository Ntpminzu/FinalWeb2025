import { ValidationError } from '../../../common/errors/app-error.js';

export function reviewSchema(input) {
  const rating = Number(input?.rating);
  const comment = String(input?.comment || '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ValidationError('Rating phải từ 1 đến 5 sao.');
  if (comment.length > 2000) throw new ValidationError('Nhận xét không được vượt quá 2000 ký tự.');
  return { rating, comment };
}
