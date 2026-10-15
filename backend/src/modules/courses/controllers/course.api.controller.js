import { feedbackDto } from '../../reviews/dto/review.dto.js';
import { courseDetailDto } from '../dto/course.dto.js';
import { courseDto } from '../dto/course.dto.js';
import * as courseService from '../services/course.service.js';
import { ok } from '../../../common/utils/api-response.js';

// hàm này chuẩn hóa dữ liệu khóa học trước khi gửi về client
// để cho frontend dễ sử dụng hơn, ví dụ: đổi tên trường, loại bỏ trường không cần thiết, chuyển đổi kiểu dữ liệu, v.v.






export async function listCourses(req, res, next) {
  try {
    const result = await courseService.listCoursesForApi(req.query);
    return ok(res, result.courses.map(courseDto), {
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.totalCourses,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCourse(req, res, next) {
  try {
    const result = await courseService.getCourseDetail(req.params.id);
    return ok(res, {
      ...courseDetailDto(result.course),
      feedbacks: result.feedbacks.map(feedbackDto),
    });
  } catch (error) {
    return next(error);
  }
}
