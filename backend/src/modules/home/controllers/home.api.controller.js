import * as homeService from '../services/home.service.js';
import { courseDto } from '../../courses/dto/course.dto.js';
import { ok } from '../../../common/utils/api-response.js';

export async function home(req, res, next) {
  try {
    const data = await homeService.homeCatalog();
    return ok(res, { outstandingCourses: data.outstandingCourses.map(courseDto), mostViewedCourses: data.mostViewedCourses.map(courseDto), newestCourses: data.newestCourses.map(courseDto), topCategories: data.topCategories.map(cat => ({ id: cat.id, name: cat.catname, enrollCount: Number(cat.enroll_count) })) });
  } catch (error) { return next(error); }
}
