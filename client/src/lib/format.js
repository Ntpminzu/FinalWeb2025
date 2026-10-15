export const money = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
export const date = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '—');
export const duration = (value) =>
  `${Math.floor(Number(value || 0) / 60)}:${String(Number(value || 0) % 60).padStart(2, '0')}`;
export function flattenCategories(categories) {
  return categories.flatMap((category) => [
    { ...category, name: category.name || category.catname },
    ...flattenCategories(category.children || []),
  ]);
}
export function safeReturnTo(value, fallback = '/') {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !/[\u0000-\u001f]/.test(value)
    ? value
    : fallback;
}
