import * as categoryService from '../services/category.service.js';
import { ok } from '../../../common/utils/api-response.js';
import { courseDto } from '../../courses/dto/course.dto.js';

export async function listCategories(req, res, next) {
  try {
    const categories = await categoryService.listCategories();
    return ok(res, categories);
  } catch (error) {
    return next(error);
  }
}

export async function listCategoryCourses(req, res, next) {
  try {
    const result = await categoryService.listByCategoryForApi(req.params.id, req.query);
    return ok(res, result.courses.map(courseDto), {
      category: result.category,
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
