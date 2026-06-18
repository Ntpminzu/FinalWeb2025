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

import Course from '../models/course.model.js';

const COURSES_PER_PAGE = 8;

export async function search(req, res, next) {
  try {
    const query = req.query.q || '';
    const sortOption = req.query.sort || 'default';
    const page = parseInt(req.query.page || 1, 10);
    const limit = COURSES_PER_PAGE;
    const offset = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
      Course.findPageByFTS(query, sortOption, limit, offset),
      Course.countByFTS(query)
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    // Tạo chuỗi query string
    const queryString = `q=${query}&sort=${sortOption}`;

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
