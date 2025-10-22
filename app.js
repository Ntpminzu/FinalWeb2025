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
      fillContent: hsb_sections(),
      format_number(value) {
        return new Intl.NumberFormat('en-US').format(value);
      }
    },
    helpers: {
      formatVnd(value) {
        if (!value) return '';
        return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
      }
    }

    },
  
));


app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static('static'));

app.get('/about', function (req, res) {
  res.sendFile(__dirname + '/about.html');
});

app.get('/bs', function (req, res) {
  res.sendFile(__dirname + '/bs.html');
});



app.use(async function (req, res, next) {
  if (req.session.isAuthenticated) {
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.session.authUser;
  } else {
    res.locals.isAuthenticated = false;
  }

  next();
});

app.get('/', function (req, res) {
  // res.send('Hello, World!');

  // if (req.session.isAuthenticated) {
  //   console.log('User:', req.session.authUser);
  // } else console.log('User: none');

  res.render('home');
});

// import categoryRouter from './routes/category.route.js';
// import { restrict, restrictAdmin } from './middlewares/auth.mdw.js';
// app.use('/admin/categories', restrict, restrictAdmin, categoryRouter);

// import productAdminRouter from './routes/product-admin.route.js';
// app.use('/admin/products', restrict, restrictAdmin, productAdminRouter);

// import productRouter from './routes/product.route.js';
// app.use('/products', productRouter);

import studentRouter from './routes/student.route.js';
app.use('/student', studentRouter);


import accountRouter from './routes/account.route.js';
app.use('/account', accountRouter);
import courseRouter from './routes/course.route.js';
app.use('/courses', courseRouter);
import watchlistRouter from './routes/watchlist.route.js';
app.use('/watchlist', watchlistRouter);
app.use(function (req, res) {
  res.status(404).render('404');
});

app.listen(4000, function () {
  console.log('Server is running on http://localhost:4000');
});