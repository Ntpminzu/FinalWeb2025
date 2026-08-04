import multer from 'multer';
import { AppError } from '../errors/app-error.js';

function isApiRequest(req) {
  return req.originalUrl.startsWith('/api/');
}

function apiError(error) {
  return {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Đã có lỗi xảy ra.',
      status: error.statusCode || 500,
    },
  };
}

export function notFoundHandler(req, res) {
  if (isApiRequest(req)) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Không tìm thấy tài nguyên.',
        status: 404,
      },
    });
  }
  return res.status(404).render('404');
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (process.env.NODE_ENV !== 'test' || !error.isOperational) console.error(error);
  if (error instanceof multer.MulterError) {
    if (isApiRequest(req)) {
      return res.status(400).json({
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Tệp tải lên không hợp lệ hoặc vượt quá 5 MB.',
          status: 400,
        },
      });
    }
    return res.status(400).send('Tệp tải lên không hợp lệ hoặc vượt quá 5 MB.');
  }
  if (error instanceof AppError) {
    const wantsJson = isApiRequest(req) || req.xhr || req.accepts(['html', 'json']) === 'json';
    if (wantsJson) return res.status(error.statusCode).json(apiError(error));
    if ([403, 404].includes(error.statusCode)) return res.status(error.statusCode).render(String(error.statusCode), { message: error.message });
    return res.status(error.statusCode).send(error.message);
  }
  if (isApiRequest(req)) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Đã có lỗi xảy ra.',
        status: 500,
      },
    });
  }
  return res.status(500).render('500');
}
