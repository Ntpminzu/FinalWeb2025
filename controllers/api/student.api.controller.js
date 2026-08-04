import * as learningService from '../../services/learning.service.js';
import * as studentService from '../../services/student.service.js';
import { ok } from '../../utils/api-response.js';

function purchasedCourseDto(course) {
  return {
    courseId: course.course_id,
    title: course.course_title,
    thumbnail: course.thumbnail || null,
    shortDescription: course.short_desc || null,
    price: Number(course.price || 0),
    salePrice: course.sale_price == null ? null : Number(course.sale_price),
    purchasedAt: course.purchased_at,
    completionPercent: Number(course.completion_percent || 0),
    isCompleted: Boolean(course.is_completed),
  };
}

export async function myCourses(req, res, next) {
  try {
    const courses = await studentService.purchasedCourses(req.user.id);
    return ok(res, courses.map(purchasedCourseDto));
  } catch (error) {
    return next(error);
  }
}

function lectureDto(lecture) {
  return {
    id: lecture.id,
    title: lecture.title,
    videoUrl: lecture.video_url || null,
    durationSec: lecture.duration_sec == null ? null : Number(lecture.duration_sec),
    orderIndex: Number(lecture.ord || 0),
  };
}

function feedbackDto(feedback) {
  return {
    studentName: feedback.student_name || null,
    rating: Number(feedback.rating),
    comment: feedback.comment || '',
    createdAt: feedback.created_at,
  };
}

export async function courseProgress(req, res, next) {
  try {
    const result = await learningService.courseLectures(req.user.id, req.params.courseId);
    return ok(res, {
      courseId: result.courseId,
      lectures: result.lectures.map(lectureDto),
      feedbacks: result.feedbacks.map(feedbackDto),
    });
  } catch (error) {
    return next(error);
  }
}

function progressDto(progress) {
  return {
    lectureId: progress.lecture_id,
    lastSecond: Number(progress.last_second || 0),
    watchedPercent: Number(progress.watched_percent || 0),
    isCompleted: Boolean(progress.is_completed),
  };
}

export async function saveProgress(req, res, next) {
  try {
    const progress = await learningService.saveProgress(req.user.id, {
      ...req.body,
      lectureId: req.params.lectureId,
    });
    return ok(res, progressDto(progress));
  } catch (error) {
    return next(error);
  }
}
