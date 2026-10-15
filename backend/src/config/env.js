

import './load-env.js';

function required(name, minimumLength = 1) {
  const value = process.env[name];
  if (!value || value.length < minimumLength) throw new Error(`${name} is required${minimumLength > 1 ? ` and must contain at least ${minimumLength} characters` : ''}.`);
  return value;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  sessionSecret: process.env.NODE_ENV === 'test' ? 'test-session-secret-only-not-for-production' : required('SESSION_SECRET', 32),
  jwtSecret: process.env.NODE_ENV === 'test' ? 'test-jwt-secret-only-not-for-production' : required('JWT_SECRET', 32),
  jwtIssuer: 'online-academy',
  jwtAudience: 'online-academy-api',
  accessTokenSeconds: 900,
  refreshTokenSeconds: 7 * 24 * 60 * 60,
  allowedOrigins: (process.env.FRONTEND_ORIGINS || `http://localhost:${process.env.PORT || 4000},http://localhost:5173`).split(',').map(value => value.trim()).filter(Boolean),
  secureCookie: process.env.SESSION_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
});
