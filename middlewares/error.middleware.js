import multer from 'multer';
import { AppError } from '../errors/app-error.js';

export function notFoundHandler(req, res) {
  return res.status(404).render('404');
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);
  if (error instanceof multer.MulterError) return res.status(400).send('Tệp tải lên không hợp lệ hoặc vượt quá 5 MB.');
  if (error instanceof AppError) {
    const wantsJson = req.xhr || req.originalUrl.includes('/api/') || req.accepts(['html', 'json']) === 'json';
    if (wantsJson) return res.status(error.statusCode).json({ ok: false, code: error.code, message: error.message });
    if ([403, 404].includes(error.statusCode)) return res.status(error.statusCode).render(String(error.statusCode), { message: error.message });
    return res.status(error.statusCode).send(error.message);
  }
  return res.status(500).render('500');
}
