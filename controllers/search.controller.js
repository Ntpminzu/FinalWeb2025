import * as catalogService from '../services/catalog.service.js';

export async function search(req, res, next) {
  try {
    const result = await catalogService.searchCourses(req.query);
    return res.render('vwCourse/search', {
      layout: 'main', query: result.q, sort: result.sort, courses: result.courses, empty: result.courses.length === 0,
      pagination: { totalPages: result.totalPages, currentPage: result.page, queryString: result.queryString },
    });
  } catch (error) { return next(error); }
}
