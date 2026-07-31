import * as catalogService from '../services/catalog.service.js';

export async function showByCategory(req, res, next) {
  try {
    const result = await catalogService.listByCategory(req.params.id, req.query);
    return res.render('vwCourse/byCategory', {
      layout: 'main', category: result.category, courses: result.courses, empty: result.courses.length === 0,
      pagination: { totalPages: result.totalPages, currentPage: result.page, queryString: null },
    });
  } catch (error) { return next(error); }
}
