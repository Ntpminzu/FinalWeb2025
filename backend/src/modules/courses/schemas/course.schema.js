import { ValidationError } from '../../../common/errors/app-error.js';
import { apiPagination, pagination, positiveInteger } from '../../../common/schemas/common.schema.js';

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

export function courseApiInput(input = {}) {
  return Object.fromEntries(Object.entries({ title: input.title, category_id: input.categoryId, short_desc: input.shortDescription, full_desc: input.fullDescription, price: input.price, sale_price: input.salePrice }).filter(([, value]) => value !== undefined));
}
