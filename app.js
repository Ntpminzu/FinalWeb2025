import express from 'express';
import { engine } from 'express-handlebars';
import hsb_sections from 'express-handlebars-sections';
import session from 'express-session';

// === TẤT CẢ IMPORT ĐƯỢC CHUYỂN LÊN ĐẦU ===
import * as categoryModel from './models/category.model.js';
import * as courseModel from './models/course.model.js';
import * as enrollmentModel from './models/enrollment.model.js';
import studentRouter from './routes/student.route.js';
import accountRouter from './routes/account.route.js';
import courseRouter from './routes/course.route.js';
import categoryRoute from './routes/category.route.js';
import searchRouter from './routes/search.route.js';
import cartRouter from './routes/cart.route.js';
// === KẾT THÚC IMPORT ===

const __dirname = import.meta.dirname;
const app = express();

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'b3f8c2a1e7d4f6g9h0j2k5l8m1n3p6q9r2s5t8u1v4w7x0y3z6a9b2c5d8e1',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.engine('handlebars', engine(
  {
    helpers: {
      // (Helper này từ file gốc của bạn, dùng cho layout)
      fillContent: hsb_sections(),

      formatVnd(value) {
        if (!value) return '';
        return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
      },
      if_eq(a, b, opts) {
        if (a === b) {
          return opts.fn(this);
        }
        return opts.inverse(this);
      },
      generateStars(rating) {
        if (typeof rating !== 'number' || rating < 0 || rating > 5) {
          return '';
        }
        let stars = '';
        const fullStars = Math.floor(rating);
        const halfStar = (rating % 1) >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        for (let i = 0; i < fullStars; i++) {
          stars += '<i class="bi bi-star-fill text-warning"></i>';
        }
        if (halfStar) {
          stars += '<i class="bi bi-star-half text-warning"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
          stars += '<i class="bi bi-star text-warning"></i>';
        }
        return stars;
      },
      chunk(context, size, options) {
        if (!context || !Array.isArray(context) || context.length === 0) {
          return options.inverse(this);
        }

        const chunks = [];
        for (let i = 0; i < context.length; i += size) {
          chunks.push(context.slice(i, i + size));
        }

        let result = '';
        for (const chunk of chunks) {
          result += options.fn(chunk);
        }
        return result;
      },

      if_contains(array, value, opts) {
        if (array && value && array.includes(value.toString())) {
          return opts.fn(this);
          return opts.inverse(this);
        }
      },
    },
  }));


app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static('static'));


app.use(async function (req, res, next) {
  if (req.session.isAuthenticated) {
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.session.authUser;

    // Tải danh sách ID khóa học mà user này sở hữu
    const ownedCourses = await enrollmentModel.findCourseIdsByStudentId(req.session.authUser.id);
    res.locals.ownedCourseIds = ownedCourses;
  } else {
    res.locals.isAuthenticated = false;
    res.locals.ownedCourseIds = []; // Khách (guest) không sở hữu gì
  }
  next();
});

// 2. Middleware lấy Categories (cho header)
app.use(async function (req, res, next) {
  try {
    const categories = await categoryModel.all();
    res.locals.categories = categories;
  } catch (err) {
    console.error("Không thể tải categories:", err);
    res.locals.categories = [];
  }
  next();
});

// 3. Middleware Giỏ hàng (cho header)
app.use(function (req, res, next) {
  if (typeof req.session.cart === 'undefined') {
    req.session.cart = [];
  }
  res.locals.cartTotal = req.session.cart.length;
  next();
});



// Route trang chủ
app.get('/', async function (req, res, next) {
  try {
    const [
      outstandingCourses,
      mostViewedCourses,
      newestCourses,
      topCategories
    ] = await Promise.all([
      courseModel.findOutstandingPastWeek(),
      courseModel.findMostViewed(10),
      courseModel.findNewest(10),
      categoryModel.findMostEnrolledPastWeek(5)
    ]);

    res.render('home', {
      outstandingCourses: outstandingCourses,
      mostViewedCourses: mostViewedCourses,
      newestCourses: newestCourses,
      topCategories: topCategories
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Các routes khác
app.use('/student', studentRouter);
app.use('/account', accountRouter);
app.use('/courses', courseRouter);
app.use('/categories', categoryRoute);
app.use('/search', searchRouter);
app.use('/cart', cartRouter);




// 404
app.use(function (req, res) {
  res.status(404).render('404');
});

// 500 
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).render('500');
});

app.listen(4000, function () {
  console.log('Server is running on http://localhost:4000');
});