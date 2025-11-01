import express from 'express';
import * as courseModel from '../models/course.model.js';
import * as feedbackModel from '../models/feedback.model.js';
const router = express.Router();
const COURSES_PER_PAGE = 9;

router.get('/', async function (req, res, next) {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = COURSES_PER_PAGE;
    const offset = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
      courseModel.findPageAll(limit, offset),
      courseModel.countAll()
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
});




router.get('/:id', async function (req, res, next) {
  try {
    const courseId = req.params.id;
    await courseModel.incrementViewCount(courseId);

    const [course, feedbacks] = await Promise.all([
      courseModel.findById(courseId),
      feedbackModel.findByCourse(courseId)
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
});
export default router;