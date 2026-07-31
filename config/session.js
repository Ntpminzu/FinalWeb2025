import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import { dbConfig } from './database.js';
import { env } from './env.js';

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  name: 'online_academy.sid',
  store: new PgSession({ conObject: dbConfig, createTableIfMissing: true }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, sameSite: 'lax', secure: env.secureCookie, maxAge: 1000 * 60 * 60 * 8 },
});
