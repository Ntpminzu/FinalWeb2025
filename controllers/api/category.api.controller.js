import * as catalogService from '../../services/catalog.service.js';
import { ok } from '../../utils/api-response.js';
import { courseDto } from './course.api.controller.js';

export async function listCategories(req, res, next) {
  try {
    const categories = await catalogService.listCategories();
    return ok(res, categories);
  } catch (error) {
    return next(error);
  }
}

export async function listCategoryCourses(req, res, next) {
  try {
    const result = await catalogService.listByCategoryForApi(req.params.id, req.query);
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
