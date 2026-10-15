import * as learningService from '../services/learning.service.js';

export async function showPurchasedCourses(req, res, next) {
  try { return res.render('vwStudent/courses', { purchasedCourses: await learningService.purchasedCourses(req.session.authUser.id) }); }
  catch (error) { return next(error); }
}
