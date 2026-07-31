import * as catalogService from '../services/catalog.service.js';

export async function listCourses(req, res, next) {
  try {
    const result = await catalogService.listCourses(req.query);
    return res.render('vwCourse/list', {
      layout: 'main', courses: result.courses, empty: result.courses.length === 0,
      pagination: { totalPages: result.totalPages, currentPage: result.page, queryString: null },
    });
  } catch (error) { return next(error); }
}

export async function showCourseDetail(req, res, next) {
  try {
    const { course, feedbacks } = await catalogService.getCourseDetail(req.params.id);
    return res.render('vwCourse/details', {
      layout: 'main', course, feedbacks, feedbackEmpty: feedbacks.length === 0,
      instructor: { name: course.instructor_name, bio: course.instructor_bio, specialization: course.instructor_specialization },
    });
  } catch (error) { return next(error); }
}
