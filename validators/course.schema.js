import { ValidationError } from '../errors/app-error.js';
import { apiPagination, pagination, positiveInteger } from './common.schema.js';

export function courseMutationSchema(input) {
  const title = String(input?.title || '').trim();
  const category_id = positiveInteger(input?.category_id, 'Lĩnh vực');
  const price = Number(input?.price);
  const sale_price = input?.sale_price === '' || input?.sale_price == null ? null : Number(input.sale_price);
  if (!title || title.length > 200 || !Number.isFinite(price) || price < 0) throw new ValidationError('Thông tin khóa học hoặc mức giá không hợp lệ.');
  if (sale_price !== null && (!Number.isFinite(sale_price) || sale_price < 0 || sale_price > price)) throw new ValidationError('Giá khuyến mãi không hợp lệ.');
  return {
    title,
    category_id,
    short_desc: String(input?.short_desc || '').trim() || null,
    full_desc: String(input?.full_desc || '').trim() || null,
    description: String(input?.full_desc || '').trim() || null,
    price,
    sale_price,
  };
}

export function lectureSchema(input) {
  const title = String(input?.title || '').trim();
  if (!title || title.length > 200) throw new ValidationError('Tiêu đề bài giảng không hợp lệ.');
  let url;
  try { url = new URL(String(input?.video_url || '')); } catch { throw new ValidationError('Link video không hợp lệ.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new ValidationError('Link video không hợp lệ.');
  return { title, video_url: url.toString() };
}

export function searchSchema(query) {
  const q = String(query?.q || '').trim().slice(0, 200);
  const allowedSorts = new Set(['default', 'rating_desc', 'price_asc']);
  const sort = allowedSorts.has(query?.sort) ? query.sort : 'default';
  return { q, sort, ...pagination(query, 8) };
}

export function courseApiQuerySchema(query) {
  const q = String(query?.q || '').trim().slice(0, 200);
  const allowedSorts = new Set(['relevance', 'newest', 'popular', 'rating_desc', 'price_asc', 'price_desc']);
  const sort = query?.sort || (q ? 'relevance' : 'newest');
  if (!allowedSorts.has(sort)) throw new ValidationError('Kiểu sắp xếp khóa học không hợp lệ.');
  const categoryId = query?.categoryId || query?.category_id
    ? positiveInteger(query.categoryId || query.category_id, 'Lĩnh vực')
    : null;
  return { q, sort, categoryId, ...apiPagination(query, 12, 50) };
}

export function reviewSchema(input) {
  const rating = Number(input?.rating);
  const comment = String(input?.comment || '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ValidationError('Rating phải từ 1 đến 5 sao.');
  if (comment.length > 2000) throw new ValidationError('Nhận xét không được vượt quá 2000 ký tự.');
  return { rating, comment };
}

export function progressSchema(input) {
  const lectureId = positiveInteger(input?.lecture_id, 'Bài giảng');
  const lastSecond = Number(input?.last_second);
  if (!Number.isFinite(lastSecond) || lastSecond < 0) throw new ValidationError('Dữ liệu tiến độ không hợp lệ.');
  return { lectureId, lastSecond };
}

export function durationSchema(input) {
  const lectureId = positiveInteger(input?.lecture_id, 'Bài giảng');
  const duration = Number(input?.duration_sec);
  if (!Number.isFinite(duration) || duration < 1 || duration > 43200) throw new ValidationError('Thời lượng bài giảng không hợp lệ.');
  return { lectureId, duration: Math.floor(duration) };
}
