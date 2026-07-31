import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdn.plyr.io', 'https://cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdn.plyr.io', 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'], mediaSrc: ["'self'", 'https:'], connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.',
});
