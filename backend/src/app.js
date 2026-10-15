import webRouter from './routes/web.routes.js';
import express from 'express';
import path from 'path';
import fs from 'node:fs';
import { backendRoot, repositoryRoot, uploadsDirectory } from './config/paths.js';
import { configureHandlebars } from './config/handlebars.js';
import { sessionMiddleware } from './config/session.js';
import { csrfProtection } from './modules/auth/middlewares/csrf.middleware.js';
import { errorHandler, notFoundHandler } from './common/middlewares/error.middleware.js';
import { authRateLimiter, securityHeaders } from './common/middlewares/security.middleware.js';
import { authViewContext, categoryViewContext, commonViewContext } from './common/middlewares/view-context.middleware.js';
import apiRouter from './routes/api.routes.js';
import { apiCors } from './modules/auth/middlewares/api-browser.middleware.js';

const rootDirectory = backendRoot;
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use('/static', express.static(path.join(rootDirectory, 'static'), { maxAge: '1d' }));
app.use('/uploads', express.static(uploadsDirectory(), { maxAge: '1d', dotfiles: 'deny' }));
app.use('/uploads', (req, res) => res.status(404).end());

configureHandlebars(app, rootDirectory);
app.use(express.urlencoded({ extended: true, limit: '100kb', parameterLimit: 100 }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/v1', apiCors, apiRouter);
// Keep all API versions out of the SPA fallback and the legacy session stack.
app.use('/api', (req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy API.', status: 404 } }));

if (process.env.SERVE_CLIENT === 'true') {
  const clientDirectory = path.join(repositoryRoot, 'client', 'dist');
  const index = path.join(clientDirectory, 'index.html');
  if (!fs.existsSync(index)) throw new Error('React build missing. Run npm run build before SERVE_CLIENT=true.');
  app.use(express.static(clientDirectory, { index: false, maxAge: '1h' }));
  app.get('/{*page}', (req, res, next) => {
    if (path.extname(req.path) || !req.accepts('html')) return res.status(404).end();
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(index);
  });
  app.use((req, res) => res.status(404).end());
}
app.use(sessionMiddleware);
app.use(['/account/signin', '/account/signup', '/account/is-available'], authRateLimiter);
app.use(csrfProtection);
app.use(commonViewContext);
app.use(authViewContext);
app.use(categoryViewContext);


app.use(webRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
