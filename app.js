// console.log('Hello, World!');

import express from 'express';
import { engine } from 'express-handlebars';
import hsb_sections from 'express-handlebars-sections';
import session from 'express-session';

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
          return ''; // Không hiển thị gì nếu rating không hợp lệ
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
      }

    },


  },

));


app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static('static'));





app.use(async function (req, res, next) {
  if (req.session.isAuthenticated) {
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.session.authUser;
  } else {
    res.locals.isAuthenticated = false;
  }

  next();
});

import * as categoryModel from './models/category.model.js';

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


app.use(function (req, res, next) {

  if (typeof req.session.cart === 'undefined') {
    req.session.cart = [];
  }
  res.locals.cartTotal = req.session.cart.length;
  next();
});

import * as courseModel from './models/course.model.js';

app.get('/', async function (req, res, next) {
  try {
    const courses = await courseModel.findOutstandingPastWeek();
    res.render('home', {
      featuredCourses: courses
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

import studentRouter from './routes/student.route.js';
app.use('/student', studentRouter);


import accountRouter from './routes/account.route.js';
app.use('/account', accountRouter);
import courseRouter from './routes/course.route.js';
app.use('/courses', courseRouter);
import categoryRoute from './routes/category.route.js';
app.use('/categories', categoryRoute);
import searchRouter from './routes/search.route.js';
app.use('/search', searchRouter);
import cartRouter from './routes/cart.route.js';
app.use('/cart', cartRouter);


app.use(function (req, res) {
  res.status(404).render('404');
});

app.listen(4000, function () {
  console.log('Server is running on http://localhost:4000');
});