/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Instructor — Controller                           ║
 * ║  Class Diagram Methods → Controller Mapping:                 ║
 * ║                                                              ║
 * ║    + viewCourseDetail(id): Course                            ║
 * ║        → see controllers/course.controller.js                ║
 * ║          (UC [03] View Course Details)                       ║
 * ║    + searchCourse(query): List                               ║
 * ║        → see controllers/search.controller.js                ║
 * ║          (UC [04] Search Course)                             ║
 * ║    + register(): void                                        ║
 * ║        → see controllers/account.controller.js               ║
 * ║          (UC [01] Register)                                  ║
 * ║    + login(): void                                           ║
 * ║        → see controllers/account.controller.js               ║
 * ║          (UC [02] Login)                                     ║
 * ║    + browseCourses(page): List                               ║
 * ║        → see controllers/course.controller.js                ║
 * ║                                                              ║
 * ║    + viewDashboard(): List           ✅ dashboard()          ║
 * ║    + createCourse(data): Course      ✅ createCourse()       ║
 * ║    + editCourse(id,data): bool       ✅ updateCourse()       ║
 * ║    + addLecture(cId,title,url)       ✅ addLecture()         ║
 * ║    + deleteLecture(id): bool         ✅ deleteLecture()      ║
 * ║    + toggleCourseStatus(id): bool    ✅ toggleCourseStatus() ║
 * ║    + updateProfile(bio,spec): bool   ✅ updateProfile()      ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [13] Create Course, [14] Manage Lecture,                  ║
 * ║    [15] Manage Course, [16] Toggle Course Status,            ║
 * ║    [18] Edit Course, [21] Manage Profile                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import multer from 'multer';
import crypto from 'crypto';

import fs from 'fs';
import path from 'path';
import InstructorDao from '../daos/instructor.dao.js';
import CourseDao from '../daos/course.dao.js';
import { safeReferrer } from '../utils/safe-redirect.js';

// --- Multer config ---
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const removeUploadedFile = file => file?.path
  ? fs.promises.unlink(file.path).catch(() => {})
  : Promise.resolve();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'thumbnails');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
    cb(null, `${crypto.randomUUID()}${extensions[file.mimetype]}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(allowed.includes(file.mimetype) ? null : new multer.MulterError('LIMIT_UNEXPECTED_FILE'), allowed.includes(file.mimetype));
  },
});

export async function requireOwnedCourse(req, res, next) {
  try {
    const course = await InstructorDao.getCourseById(req.params.id, req.session.authUser.id);
    if (!course) return res.status(404).render('404');
    req.ownedCourse = course;
    return next();
  } catch (error) {
    return next(error);
  }
}

// ══════════════════════════════════════════
// Class Diagram: Instructor.viewDashboard()
// UC [15] Manage Course — Dashboard
// ══════════════════════════════════════════

export function redirectToDashboard(req, res) {
  res.redirect('/instructor/dashboard');
}

/**
 * Dashboard giảng viên.
 * UC [15]: Hiển thị danh sách khóa học của Instructor.
 */
export async function dashboard(req, res) {
  try {
    const instructorId = req.session.authUser.id;
    const courses = await InstructorDao.getCoursesByInstructor(instructorId);
    res.render('vwInstructor/dashboard', { courses });
  } catch (err) {
    console.error('❌ Lỗi khi tải Dashboard:', err);
    res.status(500).send('Không thể tải trang Dashboard.');
  }
}

// ══════════════════════════════════════════
// UC [13] Create Course
// Class Diagram: Instructor.createCourse(data)
// ══════════════════════════════════════════

/**
 * Form tạo khóa học mới.
 * UC [13] Main Flow Step 2: Hiển thị form tạo khóa học.
 */
export async function showNewForm(req, res) {
  try {
    const categories = await InstructorDao.getAllCategories();
    res.render('vwInstructor/new', {
      categories,
      authUser: req.session?.authUser || null,
    });
  } catch (err) {
    console.error('❌ Lỗi khi tải form tạo khóa học:', err);
    res.status(500).send('Không thể tải form tạo khóa học.');
  }
}

/**
 * Xử lý tạo khóa học mới.
 * UC [13] Main Flow Step 3-7: Instructor nhập thông tin → hệ thống tạo khóa học.
 * Exception 5.1: Thiếu thông tin hoặc sai định dạng ảnh.
 */
export async function createCourse(req, res) {
  try {
    const { title, category_id, short_desc, full_desc, price, sale_price } = req.body;
    const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;
    const numericPrice = Number(price);
    const numericSalePrice = sale_price === '' || sale_price == null ? null : Number(sale_price);

    if (!title?.trim() || !Number.isInteger(Number(category_id)) || !Number.isFinite(numericPrice) || numericPrice < 0 ||
      (numericSalePrice !== null && (!Number.isFinite(numericSalePrice) || numericSalePrice < 0 || numericSalePrice > numericPrice))) {
      await removeUploadedFile(req.file);
      return res.status(400).send('Thông tin khóa học hoặc mức giá không hợp lệ.');
    }
    if (!await InstructorDao.getCategoryById(category_id)) {
      await removeUploadedFile(req.file);
      return res.status(400).send('Lĩnh vực không tồn tại.');
    }

    await InstructorDao.addCourse({
      instructor_id: req.session.authUser.id,
      title: title.trim(),
      category_id,
      short_desc,
      full_desc,
      description: full_desc,
      price: numericPrice,
      sale_price: numericSalePrice,
      thumbnail,
    });

    res.redirect('/instructor/dashboard');
  } catch (err) {
    await removeUploadedFile(req.file);
    console.error('❌ Lỗi khi thêm khóa học:', err);
    res.status(500).send('Đã xảy ra lỗi khi tạo khóa học.');
  }
}

// ══════════════════════════════════════════
// UC [18] Edit Course
// Class Diagram: Instructor.editCourse(id, data)
// ══════════════════════════════════════════

/**
 * Trang chỉnh sửa khóa học.
 * UC [18] Main Flow Step 3: Hiển thị thông tin hiện tại của khóa học.
 */
export async function showEditCourse(req, res) {
  try {
    const courseId = req.params.id;
    const course = req.ownedCourse || await InstructorDao.getCourseById(courseId, req.session.authUser.id);
    if (!course) return res.status(404).render('404');
    const lectures = await InstructorDao.getLecturesByCourse(courseId);

    const categories = await InstructorDao.getAllCategories();
    res.render('vwInstructor/edit-course', {
      course,
      lectures,
      categories,
      authUser: req.session.authUser
    });
  } catch (err) {
    console.error('❌ Lỗi khi tải trang chỉnh sửa:', err);
    res.status(500).send('Không thể tải thông tin khóa học.');
  }
}

/**
 * Cập nhật thông tin khóa học.
 * UC [18] Main Flow Step 5-9: Instructor nhấn "Lưu" → validate → cập nhật DB.
 * Exception E1: Trường bắt buộc bỏ trống.
 * Exception E2: Lỗi DB/upload.
 */
export async function updateCourse(req, res) {
  try {
    const { title, short_desc, full_desc, category_id, price, sale_price } = req.body;
    const thumbnail = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;
    const numericPrice = Number(price);
    const numericSalePrice = sale_price === '' || sale_price == null ? null : Number(sale_price);
    if (!title?.trim() || !Number.isInteger(Number(category_id)) || !Number.isFinite(numericPrice) || numericPrice < 0 ||
      (numericSalePrice !== null && (!Number.isFinite(numericSalePrice) || numericSalePrice < 0 || numericSalePrice > numericPrice))) {
      await removeUploadedFile(req.file);
      return res.status(400).send('Thông tin khóa học hoặc mức giá không hợp lệ.');
    }
    if (!await InstructorDao.getCategoryById(category_id)) {
      await removeUploadedFile(req.file);
      return res.status(400).send('Lĩnh vực không tồn tại.');
    }

    const updated = await InstructorDao.updateCourse(req.params.id, req.session.authUser.id, {
      title: title.trim(),
      short_desc,
      full_desc,
      description: full_desc,
      category_id: Number(category_id),
      price: numericPrice,
      sale_price: numericSalePrice,
      thumbnail,
    });
    if (!updated) {
      await removeUploadedFile(req.file);
      return res.status(404).render('404');
    }

    res.redirect('/instructor/dashboard');
  } catch (err) {
    await removeUploadedFile(req.file);
    console.error('❌ Lỗi khi cập nhật khóa học:', err);
    res.status(500).send('Không thể cập nhật khóa học.');
  }
}

// ══════════════════════════════════════════
// UC [14] Manage Lecture
// Class Diagram: Instructor.addLecture(), deleteLecture()
// ══════════════════════════════════════════

/**
 * Trang quản lý bài giảng.
 * UC [14] Main Flow Step 2: Hiển thị danh sách bài giảng + form thêm mới.
 */
export async function showEditLectures(req, res) {
  try {
    const courseId = req.params.id;
    const course = await InstructorDao.getCourseById(courseId, req.session.authUser.id);
    if (!course) return res.status(404).render('404');
    const lectures = await InstructorDao.getLecturesByCourse(courseId);

    res.render('vwInstructor/edit-lectures', { course, lectures });
  } catch (err) {
    console.error('❌ Lỗi khi tải danh sách bài giảng:', err);
    res.status(500).send('Không thể tải danh sách bài giảng.');
  }
}

/**
 * Thêm bài giảng (chỉ nhập link video).
 * UC [14] Main Flow a: Instructor nhập tên + link video → hệ thống lưu.
 * Exception 4.a.3.1: Thiếu tên hoặc URL.
 * Exception 4.a.3.2: URL sai định dạng.
 */
export async function addLecture(req, res) {
  try {
    const { courseId } = req.params;
    const { title, video_url } = req.body;

    if (!title?.trim() || title.trim().length > 200 || !video_url) {
      return res.status(400).send('Thiếu tiêu đề hoặc link video.');
    }

    let parsedUrl;
    try { parsedUrl = new URL(video_url); } catch { return res.status(400).send('Link video không hợp lệ.'); }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return res.status(400).send('Link video không hợp lệ.');

    const lecture = await InstructorDao.addLecture(courseId, req.session.authUser.id, title.trim(), parsedUrl.toString());
    if (!lecture) return res.status(404).render('404');

    res.redirect(`/instructor/edit/lectures/${courseId}`);
  } catch (err) {
    console.error('❌ Lỗi thêm bài giảng:', err);
    res.status(500).send('Không thể thêm bài giảng.');
  }
}

/**
 * Xóa bài giảng.
 * UC [14] Main Flow b: Instructor nhấn "Xóa" → hệ thống xóa.
 */
export async function deleteLecture(req, res) {
  try {
    const { lectureId } = req.params;
    const deleted = await InstructorDao.deleteLecture(lectureId, req.session.authUser.id);
    if (!deleted) return res.status(404).render('404');
    res.redirect(safeReferrer(req, '/instructor/dashboard'));
  } catch (err) {
    console.error('❌ Lỗi xóa bài giảng:', err);
    res.status(500).send('Không thể xóa bài giảng.');
  }
}

// ══════════════════════════════════════════
// UC [21] Manage Profile — Instructor
// Class Diagram: Instructor.updateProfile(bio, spec)
// ══════════════════════════════════════════

/**
 * Trang hồ sơ giảng viên.
 * UC [21]: Hiển thị thông tin cá nhân + danh sách khóa học.
 */
export async function showProfile(req, res) {
  try {
    const instructorId = req.session.authUser.id;
    const instructor = await InstructorDao.findById(instructorId);
    const courses = await InstructorDao.getCoursesByInstructor(instructorId);

    res.render('vwInstructor/profile', {
      instructor,
      courses,
      authUser: req.session.authUser,
    });
  } catch (err) {
    console.error('❌ Lỗi khi tải hồ sơ giảng viên:', err);
    res.status(500).send('Không thể tải hồ sơ giảng viên.');
  }
}

/** Trang chỉnh sửa hồ sơ */
export async function showEditProfile(req, res) {
  try {
    const instructor = await InstructorDao.findById(req.session.authUser.id);
    res.render('vwInstructor/edit-profile', { instructor });
  } catch (err) {
    console.error('❌ Lỗi khi tải trang chỉnh sửa hồ sơ:', err);
    res.status(500).send('Không thể tải trang chỉnh sửa hồ sơ.');
  }
}

/**
 * Cập nhật thông tin hồ sơ (bio, specialization).
 * Class Diagram: Instructor.updateProfile(bio, spec)
 */
export async function updateProfile(req, res) {
  try {
    const { bio, specialization } = req.body;
    await InstructorDao.update(req.session.authUser.id, { bio, specialization });
    res.redirect('/instructor/profile');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật hồ sơ:', err);
    res.status(500).send('Không thể cập nhật hồ sơ.');
  }
}

// ══════════════════════════════════════════
// UC [16] Toggle Course Status
// Class Diagram: Instructor.toggleCourseStatus(id)
// ══════════════════════════════════════════

/**
 * Toggle trạng thái khóa học (Hoàn thành ↔ Chưa hoàn thành).
 * UC [16] Main Flow: Instructor nhấn "Xuất bản/Ẩn" → hệ thống cập nhật.
 * Exception 3.a: Khóa học chưa có bài giảng → không cho xuất bản.
 */
export async function toggleCourseStatus(req, res) {
  try {
    const { id } = req.params;
    const course = await InstructorDao.getCourseById(id, req.session.authUser.id);
    if (!course) return res.status(404).send('Không tìm thấy khóa học');

    const newStatus = !course.Status;

    if (newStatus && await InstructorDao.countLectures(id, req.session.authUser.id) === 0) {
      return res.status(400).send('Khóa học cần có ít nhất một bài giảng trước khi xuất bản.');
    }

    await CourseDao.toggleStatus(id, newStatus, req.session.authUser.id);


    res.redirect('/instructor/dashboard');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật Status:', err);
    res.status(500).send('Không thể cập nhật Status.');
  }
}
