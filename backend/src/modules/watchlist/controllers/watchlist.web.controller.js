import * as watchlistService from '../services/watchlist.service.js';
import { safeReferrer } from '../../../common/utils/safe-redirect.js';

const profileView = (req, extra = {}) => ({ user: req.session.authUser, isAuthenticated: true, authUser: req.session.authUser, error: false, success: false, ...extra });
export async function showWatchlist(req, res, next) {
  try {
    const items = await watchlistService.listWatchlist(req.session.authUser.id);
    return res.render('vwStudent/watchlist', { ...profileView(req), items, ok: req.query.ok === '1', removed: req.query.removed === '1' });
  } catch (error) { return next(error); }
}

export async function addToWatchlist(req, res, next) {
  try {
    const courseId = await watchlistService.addToWatchlist(req.session.authUser.id, req.body.course_id, req.body.course_title);
    return res.redirect(safeReferrer(req, `/courses/${courseId}`));
  } catch (error) { return next(error); }
}

export async function removeFromWatchlist(req, res, next) {
  try {
    await watchlistService.removeFromWatchlist(req.session.authUser.id, req.body.course_id);
    return res.redirect('/student/watchlist?removed=1');
  } catch (error) { return next(error); }
}
