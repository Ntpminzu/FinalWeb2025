import crypto from 'crypto';

const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function csrfProtection(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  const token = req.session.csrfToken;
  res.locals.csrfToken = token;
  if (!stateChangingMethods.has(req.method)) return next();
  const supplied = String(req.body?._csrf || req.query?._csrf || req.get('x-csrf-token') || '');
  const expected = Buffer.from(token);
  const actual = Buffer.from(supplied);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return res.status(403).render('403', { message: 'Yêu cầu đã hết hạn hoặc không hợp lệ. Vui lòng tải lại trang.' });
  }
  return next();
}
