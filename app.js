// app.js — Unified (Express + ESM + Handlebars)

import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Auth
import { restrictAdmin } from './middlewares/auth.mdw.js';

// DAOs
import CategoryDao from './daos/category.dao.js';
import CourseDao from './daos/course.dao.js';
import db, { dbConfig } from './utils/db.js';

// Routers
import adminRouter from './routes/admin.route.js';
import studentRouter from './routes/student.route.js';
import accountRouter from './routes/account.route.js';
import courseRouter from './routes/course.route.js';
import categoryRoute from './routes/category.route.js';
import searchRouter from './routes/search.route.js';
import cartRouter from './routes/cart.route.js';
import instructorRouter from './routes/instructor.route.js';

// __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App
const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdn.plyr.io', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdn.plyr.io', 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use('/static', express.static(path.join(__dirname, 'static'), { maxAge: '1d' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '1d', dotfiles: 'deny' }));

// Session
app.set('trust proxy', 1);
const PgSession = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters.');
}
app.use(session({
  name: 'online_academy.sid',
  store: new PgSession({ conObject: dbConfig, createTableIfMissing: true }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.SESSION_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

// Handlebars
app.engine('handlebars', engine({
  extname: '.handlebars',
  defaultLayout: 'main',
  helpers: {
    section: hbs_sections(),
    fillContent: hbs_sections(),

    // Format helpers
    format_number(v) { return new Intl.NumberFormat('en-US').format(v); },
    formatVnd(v) { return v == null ? '' : Number(v).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }); },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : ''; },
    formatDuration(sec) {
      const s = Math.max(0, Number(sec) || 0);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      return (h ? `${h}:` : '') + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    },

    // Logic helpers
    eq: (a, b) => a === b,
    isEqual: (a, b) => a === b,
    if_eq(a, b, opts) { return a === b ? opts.fn(this) : opts.inverse(this); },
    ifCond(v1, v2, opts) { return v1 == v2 ? opts.fn(this) : opts.inverse(this); },
    gt(a, b) { return a > b; },
    lt(a, b) { return a < b; },
    if_contains(arr, val, opts) {
      return (arr && val && arr.map(String).includes(String(val))) ? opts.fn(this) : opts.inverse(this);
    },

    // Array & chunking
    array() { return Array.from(arguments).slice(0, -1); },
    range(from, to) { return Array.from({ length: to - from + 1 }, (_, i) => from + i); },
    rangeAdd(count, total) { return Array.from({ length: total - count }, (_, i) => i); },
    chunk(ctx, size, opts) {
      if (!Array.isArray(ctx) || !ctx.length) return opts.inverse(this);
      const chunks = [];
      for (let i = 0; i < ctx.length; i += size) chunks.push(ctx.slice(i, i + size));
      return chunks.map(c => opts.fn(c)).join('');
    },

    // UI helpers
    generateStars(r) {
      if (typeof r !== 'number' || r < 0 || r > 5) return '';
      let stars = '';
      const full = Math.floor(r);
      const half = (r % 1) >= 0.5 ? 1 : 0;
      const empty = 5 - full - half;
      for (let i = 0; i < full; i++) stars += '<i class="bi bi-star-fill text-warning"></i>';
      if (half) stars += '<i class="bi bi-star-half text-warning"></i>';
      for (let i = 0; i < empty; i++) stars += '<i class="bi bi-star text-warning"></i>';
      return stars;
    },
    thumb(urlOrFile) {
      const s = String(urlOrFile || '');
      if (s.startsWith('http://') || s.startsWith('https://')) return s;
      return `/static/img/courses/${s || 'placeholder.png'}`;
    },

    // Math
    add(a, b) { return a + b; },
    subtract(a, b) { return a - b; },

    // Pagination
    generatePageNumbers(totalPages, currentPage) {
      let pages = [];
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage < 3) endPage = Math.min(5, totalPages);
      if (currentPage > totalPages - 2) startPage = Math.max(1, totalPages - 4);

      if (startPage > 1) {
        pages.push({ number: 1 });
        pages.push({ isEllipsis: true });
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push({ number: i, isCurrent: i === currentPage });
      }
      if (endPage < totalPages) {
        pages.push({ isEllipsis: true });
        pages.push({ number: totalPages });
      }
      return pages;
    },
  },
  partialsDir: [
    path.join(__dirname, 'views', 'partials'),
    path.join(__dirname, 'views', 'vwAccount'),
    path.join(__dirname, 'views', 'vwAdminCategory'),
    path.join(__dirname, 'views', 'vwAdminProduct'),
    path.join(__dirname, 'views', 'vwProduct'),
    path.join(__dirname, 'views', 'vwInstructor', 'partials'),
  ],
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true, limit: '100kb', parameterLimit: 100 }));
app.use(express.json({ limit: '100kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.',
});
app.use(['/account/signin', '/account/signup', '/account/is-available'], authLimiter);

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  return req.session.csrfToken;
}

app.use((req, res, next) => {
  const token = ensureCsrfToken(req);
  res.locals.csrfToken = token;
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();

  const supplied = req.body?._csrf || req.query?._csrf || req.get('x-csrf-token') || '';
  const expected = Buffer.from(token);
  const actual = Buffer.from(String(supplied));
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return res.status(403).render('403', {
      message: 'Yêu cầu đã hết hạn hoặc không hợp lệ. Vui lòng tải lại trang.',
    });
  }
  return next();
});
// Global view data used by the shared layout.
app.use((req, res, next) => {
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;
  next();
});

// Auth locals + ownedCourseIds
app.use(async (req, res, next) => {
  try {
    if (req.session.isAuthenticated && req.method === 'GET') {
      res.locals.isAuthenticated = true;
      res.locals.authUser = req.session.authUser;

      const ownedRows = await db('purchased').where('user_id', req.session.authUser.id).select('course_id');
      res.locals.ownedCourseIds = ownedRows.map(r => String(r.course_id));
    } else {
      res.locals.isAuthenticated = false;
      res.locals.ownedCourseIds = [];
    }
    next();
  } catch (err) {
    console.error('Auth locals error:', err);
    res.locals.isAuthenticated = false;
    res.locals.ownedCourseIds = [];
    next();
  }
});

// Categories for header (short cache avoids one identical query per request)
let categoryCache = { data: [], expiresAt: 0 };
app.use(async (req, res, next) => {
  try {
    if (Date.now() >= categoryCache.expiresAt) {
      categoryCache = { data: await CategoryDao.all(), expiresAt: Date.now() + 60_000 };
    }
    res.locals.categories = categoryCache.data;
  } catch (err) {
    console.error('Không thể tải categories:', err);
    res.locals.categories = [];
  }
  next();
});

// Cart badge
app.use((req, res, next) => {
  if (typeof req.session.cart === 'undefined') req.session.cart = [];
  res.locals.cartTotal = req.session.cart.length;
  next();
});

// Home
app.get('/', async (req, res, next) => {
  try {
    const [outstandingCourses, mostViewedCourses, newestCourses, topCategories] =
      await Promise.all([
        CourseDao.findOutstandingPastWeek(),     // TODO: có thể đổi sang purchased
        CourseDao.findMostViewed(10),
        CourseDao.findNewest(10),
        CategoryDao.findMostEnrolledPastWeek(5), // TODO: có findMostPurchasedPastWeek thì đổi
      ]);
    res.render('home', { outstandingCourses, mostViewedCourses, newestCourses, topCategories });
  } catch (err) {
    console.error('Home error:', err);
    next(err);
  }
});

// Routers
app.use('/admin', restrictAdmin, adminRouter);
app.use('/student', studentRouter);
app.use('/account', accountRouter);
app.use('/courses', courseRouter);
app.use('/categories', categoryRoute);
app.use('/search', searchRouter);
app.use('/cart', cartRouter);
app.use('/instructor', instructorRouter);


// Errors
app.use((req, res) => res.status(404).render('404'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err?.name === 'MulterError') {
    return res.status(400).send('Tệp tải lên không hợp lệ hoặc vượt quá 5 MB.');
  }
  res.status(500).render('500');
});

// Start
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`✅ Server is running at http://localhost:${port}`));
