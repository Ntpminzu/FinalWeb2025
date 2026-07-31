import { AppError } from '../errors/app-error.js';
import { removeUploadedFile } from '../middlewares/upload.middleware.js';
import * as instructorService from '../services/instructor.service.js';
import { safeReferrer } from '../utils/safe-redirect.js';

export function redirectToDashboard(req, res) { return res.redirect('/instructor/dashboard'); }

export async function dashboard(req, res, next) {
  try { return res.render('vwInstructor/dashboard', { courses: await instructorService.dashboard(req.session.authUser.id) }); }
  catch (error) { return next(error); }
}

export async function showNewForm(req, res, next) {
  try { return res.render('vwInstructor/new', { categories: await instructorService.categories(), authUser: req.session.authUser }); }
  catch (error) { return next(error); }
}

export async function createCourse(req, res, next) {
  try {
    const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;
    await instructorService.createCourse(req.session.authUser.id, req.body, thumbnail);
    return res.redirect('/instructor/dashboard');
  } catch (error) {
    await removeUploadedFile(req.file);
    return next(error);
  }
}

export async function showEditCourse(req, res, next) {
  try {
    const context = await instructorService.editCourseContext(req.session.authUser.id, req.params.id, req.ownedCourse);
    return res.render('vwInstructor/edit-course', { ...context, authUser: req.session.authUser });
  } catch (error) { return next(error); }
}

export async function updateCourse(req, res, next) {
  try {
    const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;
    await instructorService.updateCourse(req.session.authUser.id, req.params.id, req.body, thumbnail);
    return res.redirect('/instructor/dashboard');
  } catch (error) {
    await removeUploadedFile(req.file);
    return next(error);
  }
}

export async function showEditLectures(req, res, next) {
  try { return res.render('vwInstructor/edit-lectures', await instructorService.lectureManagement(req.session.authUser.id, req.params.id)); }
  catch (error) { return next(error); }
}

export async function addLecture(req, res, next) {
  try {
    const courseId = await instructorService.addLecture(req.session.authUser.id, req.params.courseId, req.body);
    return res.redirect(`/instructor/edit/lectures/${courseId}`);
  } catch (error) { return next(error); }
}

export async function deleteLecture(req, res, next) {
  try {
    await instructorService.deleteLecture(req.session.authUser.id, req.params.lectureId);
    return res.redirect(safeReferrer(req, '/instructor/dashboard'));
  } catch (error) { return next(error); }
}

export async function showProfile(req, res, next) {
  try {
    const context = await instructorService.profile(req.session.authUser.id);
    return res.render('vwInstructor/profile', { ...context, authUser: req.session.authUser });
  } catch (error) { return next(error); }
}

export async function showEditProfile(req, res, next) {
  try { return res.render('vwInstructor/edit-profile', { instructor: await instructorService.findProfile(req.session.authUser.id) }); }
  catch (error) { return next(error); }
}

export async function updateProfile(req, res, next) {
  try { await instructorService.updateProfile(req.session.authUser.id, req.body); return res.redirect('/instructor/profile'); }
  catch (error) { return next(error); }
}

export async function toggleCourseStatus(req, res, next) {
  try { await instructorService.toggleStatus(req.session.authUser.id, req.params.id); return res.redirect('/instructor/dashboard'); }
  catch (error) {
    if (error instanceof AppError && error.statusCode === 400) return res.status(400).send(error.message);
    return next(error);
  }
}
