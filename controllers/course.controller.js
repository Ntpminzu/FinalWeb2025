/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Course Controller                                          ║
 * ║  Class Diagram Mapping:                                      ║
 * ║    Student.viewCourseDetail(id)  → showCourseDetail()        ║
 * ║    Student.viewCourseList(page)  → listCourses()             ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [03] View Course Details, [07] View Courses by Category   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
// controllers/course.controller.js

import CourseDao from '../daos/course.dao.js';
import FeedbackDao from '../daos/feedback.dao.js';

const COURSES_PER_PAGE = 9;

export async function listCourses(req, res, next) {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = COURSES_PER_PAGE;
    const offset = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
      CourseDao.findPageAll(limit, offset),
      CourseDao.countAll()
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    res.render('vwCourse/list', {
      layout: 'main',
      courses: courses,
      empty: courses.length === 0,
      pagination: {
        totalPages: totalPages,
        currentPage: page,
        queryString: null
      }
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
}

export async function showCourseDetail(req, res, next) {
  try {
    const courseId = req.params.id;
    await CourseDao.incrementViewCount(courseId);

    const [course, feedbacks] = await Promise.all([
      CourseDao.findById(courseId),
      FeedbackDao.findByCourse(courseId)
    ]);

    if (!course) {
      return res.status(404).render('404');
    }

    res.render('vwCourse/details', {
      layout: 'main',
      course: course,
      feedbacks: feedbacks,
      feedbackEmpty: feedbacks.length === 0,

      instructor: {
        name: course.instructor_name,
        bio: course.instructor_bio,
        specialization: course.instructor_specialization
      }
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
}
