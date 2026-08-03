import * as catalogService from '../../services/catalog.service.js';
import { ok } from '../../utils/api-response.js';
// hàm này chuẩn hóa dữ liệu khóa học trước khi gửi về client
// để cho frontend dễ sử dụng hơn, ví dụ: đổi tên trường, loại bỏ trường không cần thiết, chuyển đổi kiểu dữ liệu, v.v.
export function courseDto(course) {
  return {
    id: course.id,
    title: course.title,
    shortDescription: course.short_desc || course.description || null,
    price: Number(course.price),
    salePrice: course.sale_price == null ? null : Number(course.sale_price),
    ratingAverage: Number(course.rating_avg || 0),
    ratingCount: Number(course.rating_count || 0),
    category: course.category || null,
    instructorName: course.instructor_name || null,
    thumbnail: course.thumbnail || null,
  };
}

function courseDetailDto(course) {
  return {
    ...courseDto({
      ...course,
      category: course.category_name || course.category,
    }),
    fullDescription: course.full_desc || course.description || null,
    instructorBio: course.instructor_bio || null,
    instructorSpecialization: course.instructor_specialization || null,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
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

export async function listCourses(req, res, next) {
  try {
    const result = await catalogService.listCoursesForApi(req.query);
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
    const result = await catalogService.getCourseDetail(req.params.id);
    return ok(res, {
      ...courseDetailDto(result.course),
      feedbacks: result.feedbacks.map(feedbackDto),
    });
  } catch (error) {
    return next(error);
  }
}
