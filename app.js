import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { configureHandlebars } from './config/handlebars.js';
import { sessionMiddleware } from './config/session.js';
import * as homeController from './controllers/home.controller.js';
import { restrictAdmin } from './middlewares/auth.mdw.js';
import { csrfProtection } from './middlewares/csrf.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { authRateLimiter, securityHeaders } from './middlewares/security.middleware.js';
import { authViewContext, categoryViewContext, commonViewContext } from './middlewares/view-context.middleware.js';
import accountRouter from './routes/account.route.js';
import adminRouter from './routes/admin.route.js';
import cartRouter from './routes/cart.route.js';
import categoryRouter from './routes/category.route.js';
import courseRouter from './routes/course.route.js';
import instructorRouter from './routes/instructor.route.js';
import searchRouter from './routes/search.route.js';
import studentRouter from './routes/student.route.js';
import apiRouter from './routes/api/index.js';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use('/static', express.static(path.join(rootDirectory, 'static'), { maxAge: '1d' }));
app.use('/uploads', express.static(path.join(rootDirectory, 'uploads'), { maxAge: '1d', dotfiles: 'deny' }));
app.use(sessionMiddleware);

configureHandlebars(app, rootDirectory);
app.use(express.urlencoded({ extended: true, limit: '100kb', parameterLimit: 100 }));
app.use(express.json({ limit: '100kb' }));
app.use(['/account/signin', '/account/signup', '/account/is-available'], authRateLimiter);
app.use('/api/v1', apiRouter);
app.use(csrfProtection);
app.use(commonViewContext);
app.use(authViewContext);
app.use(categoryViewContext);

app.get('/', homeController.home);
app.use('/admin', restrictAdmin, adminRouter);
app.use('/student', studentRouter);
app.use('/account', accountRouter);
app.use('/courses', courseRouter);
app.use('/categories', categoryRouter);
app.use('/search', searchRouter);
app.use('/cart', cartRouter);
app.use('/instructor', instructorRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
