// app.js — Unified (Express + ESM + Handlebars)

// --------------------- Core & Engine ---------------------
import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// --------------------- Auth Middlewares ---------------------
import { restrict, restrictAdmin } from './middlewares/auth.mdw.js';

// --------------------- Models ---------------------
import * as categoryModel from './models/category.model.js';
import * as courseModel from './models/course.model.js';
import * as enrollmentModel from './models/enrollment.model.js';
// NOTE: Nếu đã chuyển sang bảng "purchased", tạo purchasedModel và thay enrollmentModel ở middleware auth.

// --------------------- Routers ---------------------
import adminRouter from './routes/admin.route.js';
import studentRouter from './routes/student.route.js';
import accountRouter from './routes/account.route.js';
import courseRouter from './routes/course.route.js';
import categoryRoute from './routes/category.route.js';
import searchRouter from './routes/search.route.js';
import cartRouter from './routes/cart.route.js';
import instructorRouter from './routes/instructor.route.js';

// --------------------- __dirname (ESM) ---------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------- App Init ---------------------
const app = express();

// --------------------- Session ---------------------
app.set('trust proxy', 1);
app.use(
  session({
    secret: 'b3f8c2a1e7d4f6g9h0j2k5l8m1n3p6q9r2s5t8u1v4w7x0y3z6a9b2c5d8e1',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Đặt true khi deploy HTTPS
  })
);

// --------------------- Handlebars Engine ---------------------
app.engine(
  'handlebars',
  engine({
    extname: '.handlebars',
    defaultLayout: 'main',
    // Nếu có cấu trúc layouts/partials riêng, uncomment:
    // layoutsDir: path.join(__dirname, 'views', 'layouts'),
    // partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
      // sections cho layout
      section: hbs_sections(),
      // alias tương thích view cũ từng dùng fillContent
      fillContent: hbs_sections(),

      // number helpers
      format_number(value) {
        return new Intl.NumberFormat('en-US').format(value);
      },
      formatVnd(value) {
        if (value == null) return '';
        return Number(value).toLocaleString('vi-VN', {
          style: 'currency',
          currency: 'VND',
        });
      },

      // time & date helpers
      formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN');
      },
      // h:mm:ss (ẩn h nếu 0)
      formatDuration(sec) {
        const s = Math.max(0, Number(sec) || 0);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const ss = s % 60;
        return (h ? `${h}:` : '') + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
      },

      // logic helpers
      eq: (a, b) => a === b,
      isEqual: (a, b) => a === b,
      if_eq(a, b, opts) {
        return a === b ? opts.fn(this) : opts.inverse(this);
      },
      ifCond(v1, v2, options) {
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      },
      if_contains(array, value, opts) {
        if (array && value && array.map(String).includes(String(value))) {
          return opts.fn(this);
        }
        return opts.inverse(this);
      },

      // array/range helpers
      array() {
        return Array.from(arguments).slice(0, -1);
      },
      range(from, to) {
        return Array.from({ length: to - from + 1 }, (_, i) => from + i);
      },
      rangeAdd(count, total) {
        return Array.from({ length: total - count }, (_, i) => i);
      },

      // ui helpers
      generateStars(rating) {
        if (typeof rating !== 'number' || rating < 0 || rating > 5) return '';
        let stars = '';
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        for (let i = 0; i < full; i++) stars += '<i class="bi bi-star-fill text-warning"></i>';
        if (half) stars += '<i class="bi bi-star-half text-warning"></i>';
        for (let i = 0; i < empty; i++) stars += '<i class="bi bi-star text-warning"></i>';
        return stars;
      },
      chunk(context, size, options) {
        if (!Array.isArray(context) || context.length === 0) {
          return options.inverse(this);
        }
        const chunks = [];
        for (let i = 0; i < context.length; i += size) {
          chunks.push(context.slice(i, i + size));
        }
        let result = '';
        for (const c of chunks) result += options.fn(c);
        return result;
      },
    },
  })
);

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// --------------------- Middlewares ---------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth locals + owned courses
app.use(async (req, res, next) => {
  try {
    if (req.session.isAuthenticated) {
      res.locals.isAuthenticated = true;
      res.locals.authUser = req.session.authUser;

      // Nếu chuyển sang "purchased": thay bằng
      // const ownedCourses = await purchasedModel.findCourseIdsByUserId(req.session.authUser.id);
      const ownedCourses =
        await enrollmentModel.findCourseIdsByStudentId(req.session.authUser.id);
      res.locals.ownedCourseIds = ownedCourses;
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

// Categories for header
app.use(async (req, res, next) => {
  try {
    const categories = await categoryModel.all();
    res.locals.categories = categories;
  } catch (err) {
    console.error('Không thể tải categories:', err);
    res.locals.categories = [];
  }
  next();
});

// Cart badge for header
app.use((req, res, next) => {
  if (typeof req.session.cart === 'undefined') {
    req.session.cart = [];
  }
  res.locals.cartTotal = req.session.cart.length;
  next();
});

// --------------------- Basic Pages ---------------------
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});
app.get('/bs', (req, res) => {
  res.sendFile(path.join(__dirname, 'bs.html'));
});

// --------------------- Home (DB) ---------------------
app.get('/', async (req, res, next) => {
  try {
    const [outstandingCourses, mostViewedCourses, newestCourses, topCategories] =
      await Promise.all([
        courseModel.findOutstandingPastWeek(),
        courseModel.findMostViewed(10),
        courseModel.findNewest(10),
        categoryModel.findMostEnrolledPastWeek(5),
      ]);

    res.render('home', {
      outstandingCourses,
      mostViewedCourses,
      newestCourses,
      topCategories,
    });
  } catch (err) {
    console.error('Home error:', err);
    next(err);
  }
});

// --------------------- Routers ---------------------
app.use('/admin', restrict, restrictAdmin, adminRouter);
app.use('/student', studentRouter);
app.use('/account', accountRouter);
app.use('/courses', courseRouter);
app.use('/categories', categoryRoute);
app.use('/search', searchRouter);
app.use('/cart', cartRouter);
app.use('/instructor', instructorRouter);

// --------------------- Errors ---------------------
app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500');
});

// --------------------- Start ---------------------
app.listen(4000, () => {
  console.log('✅ Server is running at http://localhost:4000');
});
