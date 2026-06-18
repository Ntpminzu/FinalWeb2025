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

import Course from '../models/course.model.js';
import Feedback from '../models/feedback.model.js';

const COURSES_PER_PAGE = 9;

export async function listCourses(req, res, next) {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = COURSES_PER_PAGE;
    const offset = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
      Course.findPageAll(limit, offset),
      Course.countAll()
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
    await Course.incrementViewCount(courseId);

    const [course, feedbacks] = await Promise.all([
      Course.findById(courseId),
      Feedback.findByCourse(courseId)
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
