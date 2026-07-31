import * as sessionContextService from '../services/session-context.service.js';

let categoryCache = { data: [], expiresAt: 0 };

export function commonViewContext(req, res, next) {
  res.locals.currentYear = new Date().getFullYear();
  res.locals.currentPath = req.path;
  if (!Array.isArray(req.session.cart)) req.session.cart = [];
  res.locals.cartTotal = req.session.cart.length;
  return next();
}

export async function authViewContext(req, res, next) {
  res.locals.isAuthenticated = Boolean(req.session.isAuthenticated);
  res.locals.authUser = req.session.authUser || null;
  res.locals.ownedCourseIds = [];
  if (!req.session.isAuthenticated || !req.session.authUser || req.method !== 'GET') return next();
  try { res.locals.ownedCourseIds = await sessionContextService.ownedCourseIds(req.session.authUser.id); }
  catch (error) { console.error('Auth view context error:', error); }
  return next();
}

export async function categoryViewContext(req, res, next) {
  try {
    if (Date.now() >= categoryCache.expiresAt) categoryCache = { data: await sessionContextService.listCategories(), expiresAt: Date.now() + 60_000 };
    res.locals.categories = categoryCache.data;
  } catch (error) {
    console.error('Category view context error:', error);
    res.locals.categories = [];
  }
  return next();
}
