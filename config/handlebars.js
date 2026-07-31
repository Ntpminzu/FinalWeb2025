import { engine } from 'express-handlebars';
import hbsSections from 'express-handlebars-sections';
import path from 'path';

const helpers = {
  section: hbsSections(), fillContent: hbsSections(),
  format_number: value => new Intl.NumberFormat('en-US').format(value),
  formatVnd: value => value == null ? '' : Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
  formatDate: value => value ? new Date(value).toLocaleDateString('vi-VN') : '',
  formatDuration(value) {
    const seconds = Math.max(0, Number(value) || 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    return (hours ? `${hours}:` : '') + String(minutes).padStart(2, '0') + ':' + String(rest).padStart(2, '0');
  },
  eq: (a, b) => a === b, isEqual: (a, b) => a === b,
  if_eq(a, b, options) { return a === b ? options.fn(this) : options.inverse(this); },
  ifCond(a, b, options) { return a == b ? options.fn(this) : options.inverse(this); },
  gt: (a, b) => a > b, lt: (a, b) => a < b,
  if_contains(values, value, options) { return values && value && values.map(String).includes(String(value)) ? options.fn(this) : options.inverse(this); },
  array() { return Array.from(arguments).slice(0, -1); },
  range: (from, to) => Array.from({ length: to - from + 1 }, (_, index) => from + index),
  rangeAdd: (count, total) => Array.from({ length: total - count }, (_, index) => index),
  chunk(context, size, options) {
    if (!Array.isArray(context) || !context.length) return options.inverse(this);
    const chunks = [];
    for (let index = 0; index < context.length; index += size) chunks.push(context.slice(index, index + size));
    return chunks.map(chunk => options.fn(chunk)).join('');
  },
  generateStars(rating) {
    if (typeof rating !== 'number' || rating < 0 || rating > 5) return '';
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return '<i class="bi bi-star-fill text-warning"></i>'.repeat(full)
      + (half ? '<i class="bi bi-star-half text-warning"></i>' : '')
      + '<i class="bi bi-star text-warning"></i>'.repeat(5 - full - half);
  },
  thumb(value) {
    const source = String(value || '');
    return source.startsWith('http://') || source.startsWith('https://') ? source : `/static/img/courses/${source || 'placeholder.png'}`;
  },
  add: (a, b) => a + b, subtract: (a, b) => a - b,
  generatePageNumbers(totalPages, currentPage) {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (currentPage < 3) endPage = Math.min(5, totalPages);
    if (currentPage > totalPages - 2) startPage = Math.max(1, totalPages - 4);
    if (startPage > 1) pages.push({ number: 1 }, { isEllipsis: true });
    for (let page = startPage; page <= endPage; page += 1) pages.push({ number: page, isCurrent: page === currentPage });
    if (endPage < totalPages) pages.push({ isEllipsis: true }, { number: totalPages });
    return pages;
  },
};

export function configureHandlebars(app, rootDirectory) {
  app.engine('handlebars', engine({
    extname: '.handlebars', defaultLayout: 'main', helpers,
    partialsDir: [
      path.join(rootDirectory, 'views', 'partials'), path.join(rootDirectory, 'views', 'vwAccount'),
      path.join(rootDirectory, 'views', 'vwAdminCategory'), path.join(rootDirectory, 'views', 'vwAdminProduct'),
      path.join(rootDirectory, 'views', 'vwProduct'), path.join(rootDirectory, 'views', 'vwInstructor', 'partials'),
    ],
  }));
  app.set('view engine', 'handlebars');
  app.set('views', path.join(rootDirectory, 'views'));
}
