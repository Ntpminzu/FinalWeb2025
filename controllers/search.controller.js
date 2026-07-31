/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Search Controller                                          ║
 * ║  Class Diagram Mapping:                                      ║
 * ║    Student.searchCourse(query)  → search()                   ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [04] Search Course, [08] Filter Courses                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
// controllers/search.controller.js

import CourseDao from '../daos/course.dao.js';

const COURSES_PER_PAGE = 8;

export async function search(req, res, next) {
  try {
    const query = String(req.query.q || '').trim().slice(0, 200);
    const allowedSorts = new Set(['default', 'rating_desc', 'price_asc']);
    const sortOption = allowedSorts.has(req.query.sort) ? req.query.sort : 'default';
    const requestedPage = Number.parseInt(req.query.page || '1', 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = COURSES_PER_PAGE;
    const offset = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
      CourseDao.findPageByFTS(query, sortOption, limit, offset),
      CourseDao.countByFTS(query)
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    // Tạo chuỗi query string
    const queryString = new URLSearchParams({ q: query, sort: sortOption }).toString();

    res.render('vwCourse/search', {
      layout: 'main',
      query: query,
      sort: sortOption,
      courses: courses,
      empty: courses.length === 0,
      pagination: {
        totalPages: totalPages,
        currentPage: page,
        queryString: queryString
      }
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}
