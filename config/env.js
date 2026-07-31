import 'dotenv/config';

function required(name, minimumLength = 1) {
  const value = process.env[name];
  if (!value || value.length < minimumLength) throw new Error(`${name} is required${minimumLength > 1 ? ` and must contain at least ${minimumLength} characters` : ''}.`);
  return value;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  sessionSecret: required('SESSION_SECRET', 32),
  secureCookie: process.env.SESSION_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
});
