import * as watchlistService from '../services/watchlist.service.js';
import { ok, noContent } from '../../../common/utils/api-response.js';
import { courseDto } from '../../courses/dto/course.dto.js';

export async function watchlist(req, res, next) {
  try {
    const items = await watchlistService.listWatchlist(req.user.id);
    return ok(res, items.map(item => ({ ...courseDto({ ...item, id: item.course_id }), addedAt: item.added_at })));
  } catch (error) { return next(error); }
}

export async function addWatchlist(req, res, next) {
  try {
    const courseId = await watchlistService.addToWatchlist(req.user.id, req.body.courseId);
    return ok(res, { courseId, inWatchlist: true });
  } catch (error) { return next(error); }
}

export async function removeWatchlist(req, res, next) {
  try { await watchlistService.removeFromWatchlist(req.user.id, req.params.courseId); return noContent(res); }
  catch (error) { return next(error); }
}
