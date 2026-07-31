import * as instructorService from '../services/instructor.service.js';

export async function requireOwnedCourse(req, res, next) {
  try {
    req.ownedCourse = await instructorService.requireOwnedCourse(req.session.authUser.id, req.params.id);
    return next();
  } catch (error) {
    return next(error);
  }
}
