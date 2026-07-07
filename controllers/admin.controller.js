/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «role» Admin — Controller (permission=3)                   ║
 * ║  Class Diagram Methods → Controller Mapping:                 ║
 * ║                                                              ║
 * ║    + manageUsers(): List             ✅ listUsers()          ║
 * ║    + promoteToInstructor(id): bool   ✅ makeTeacher()        ║
 * ║    + disableUser(id,state): bool     ✅ disableUser()        ║
 * ║    + deleteUser(id): bool            ✅ deleteUser()         ║
 * ║    + manageCourses(): List           ✅ listCourses()        ║
 * ║    + disableCourse(id,state): bool   ✅ disableCourse()      ║
 * ║    + deleteCourse(id): bool          ✅ deleteCourse()       ║
 * ║    + manageCategories(): List        ✅ listCategories()     ║
 * ║    + addCategory(name): Category     ✅ addCategory()        ║
 * ║    + editCategory(id,name): bool     ✅ editCategory()       ║
 * ║    + deleteCategory(id): bool        ✅ deleteCategory()     ║
 * ║    + viewDashboard(): DashboardStats ✅ dashboard()          ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [17] Manage Users, [19] Manage Courses (Admin),           ║
 * ║    [20] Manage Categories                                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import bcrypt from 'bcryptjs';
import UserDao from '../daos/user.dao.js';
import AdminDao from '../daos/admin.dao.js';
import CategoryDao from '../daos/category.dao.js';
import CourseDao from '../daos/course.dao.js';

// ══════════════════════════════════════════
// Class Diagram: Admin.viewDashboard()
// ══════════════════════════════════════════

/**
 * 🏠 Dashboard — Hiển thị thống kê tổng quan.
 */
export async function dashboard(req, res) {
  const stats = await AdminDao.getDashboardStats() ?? {};
  const topCategories = await AdminDao.getTopCategories() ?? [];
  const courseStatuses = await AdminDao.getCourseStatuses() ?? [];

  res.render('vwAdmin/home', {
    layout: false,
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    stats,
    topCategories,
    courseStatuses,
  });
}

// ══════════════════════════════════════════
// UC [17] Manage Users
// Class Diagram: Admin.manageUsers(), promoteToInstructor(),
//                disableUser(), deleteUser()
// ══════════════════════════════════════════

/**
 * 👥 Quản lý người dùng — Hiển thị danh sách.
 * UC [17] Main Flow Step 1-3: Admin xem danh sách user phân theo vai trò.
 */
export async function listUsers(req, res) {
  const teachers = await UserDao.findTeachers();
  const students = await UserDao.findStudents();

  res.render('vwAdmin/users', {
    teachers,
    students,
  });
}

/**
 * 🚀 Cấp quyền giảng viên.
 * UC [17] Main Flow Step 4.3: Admin → Promote to Instructor.
 * Class Diagram: Admin.promoteToInstructor(id)
 */
export async function makeTeacher(req, res) {
  const { id } = req.params;
  await UserDao.promoteToTeacher(id);
  res.redirect('/admin/users');
}

/**
 * 🚫 Khóa / Mở khóa tài khoản người dùng.
 * UC [17] Main Flow Step 4.1: Admin → Disable/Enable Account.
 * Class Diagram: Admin.disableUser(id, state)
 */
export async function disableUser(req, res) {
  const { id } = req.params;
  const disable = req.body.disable === 'true';
 
  try {
    await UserDao.toggleDisable(id, disable);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('❌ Lỗi khi khóa/mở khóa user:', err);
    res.status(500).send('Không thể thay đổi trạng thái tài khoản.');
  }
}

/**
 * 🗑️ Xóa người dùng.
 * UC [17] Main Flow Step 4.2: Admin → Delete Account.
 * Class Diagram: Admin.deleteUser(id)
 */
export async function deleteUser(req, res) {
  const { id } = req.params;
  await UserDao.deleteById(id);
  res.redirect('/admin/users');
}

// ══════════════════════════════════════════
// UC [19] Manage Courses (Admin)
// Class Diagram: Admin.manageCourses(), disableCourse(), deleteCourse()
// ══════════════════════════════════════════

/**
 * 📚 Quản lý khóa học — Hiển thị danh sách.
 * UC [19] Main Flow: Admin xem toàn bộ khóa học + trạng thái.
 */
export async function listCourses(req, res) {
  try {
    const [courses, categories] = await Promise.all([
      CourseDao.getAllWithCategoryAndTeacher(),
      CategoryDao.getAllWithCourseCount(),
    ]);

    res.render('vwAdmin/courses', {
      courses,
      categories,
    });
  } catch (err) {
    console.error('❌ Lỗi khi tải admin/courses:', err);
    res.status(500).send('Không thể tải danh sách khóa học.');
  }
}

/**
 * 🗑️ Xóa khóa học.
 * UC [19]: Admin → Delete Course.
 * Class Diagram: Admin.deleteCourse(id)
 */
export async function deleteCourse(req, res) {
  const { id } = req.params;
  await CourseDao.deleteById(id);
  res.redirect('/admin/courses');
}

/**
 * 🚫 Đình chỉ / Khôi phục khóa học.
 * UC [19]: Admin → Disable/Enable Course.
 * Class Diagram: Admin.disableCourse(id, state)
 */
export async function disableCourse(req, res) {
  const courseId = req.params.id;
  const disable = req.body.disable === 'true';

  try {
    await CourseDao.toggleDisable(courseId, disable);
    return res.redirect('/admin/courses');
  } catch (err) {
    console.error('❌ Lỗi khi disable khóa học:', err);
    return res.status(500).send('Lỗi khi đình chỉ / mở lại khóa học');
  }
}

// ══════════════════════════════════════════
// UC [20] Manage Categories
// Class Diagram: Admin.manageCategories(), addCategory(),
//                editCategory(), deleteCategory()
// ══════════════════════════════════════════

/**
 * 🗂️ Quản lý danh mục — Hiển thị danh sách.
 * UC [20] Main Flow Step 1-3: Admin xem cấu trúc cây danh mục.
 */
export async function listCategories(req, res) {
  const categories = await CategoryDao.getAllWithCourseCount();
  res.render('vwAdmin/categories', { categories });
}

/**
 * Class Diagram: Admin.addCategory(name)
 * UC [20] Main Flow Step 4: Admin thêm danh mục.
 */
export async function addCategory(req, res) {
  const name = req.body.name?.trim();
  if (name) await CategoryDao.add({ name });
  res.redirect('/admin/categories');
}

/**
 * Class Diagram: Admin.editCategory(id, name)
 * UC [20] Main Flow Step 4: Admin sửa danh mục.
 */
export async function editCategory(req, res) {
  const { id, name } = req.body;
  if (id && name?.trim()) {
    await CategoryDao.patch(id, { name: name.trim() });
  }
  res.redirect('/admin/categories');
}

/**
 * Class Diagram: Admin.deleteCategory(id)
 * UC [20] Main Flow Step 4: Admin xóa danh mục.
 */
export async function deleteCategory(req, res) {
  try {
    const { id } = req.body;
    await CategoryDao.remove(id);
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.render('admin/categories', { error: 'Lỗi khi xóa lĩnh vực' });
  }
}

// ══════════════════════════════════════════
// UC [21] Manage Profile — Admin
// Class Diagram: User.updateProfile(), User.changePassword()
// ══════════════════════════════════════════

/** 👤 Trang hồ sơ admin */
export function showProfile(req, res) {
  res.render('vwAdmin/profile', {
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    error: false,
    success: false,
  });
}

export async function updateProfile(req, res) {
  const id = req.body.id;
  const updatedUser = {
    name: req.body.name?.trim(),
    email: req.body.email?.trim(),
  };
  await UserDao.updateProfile(id, updatedUser);
  req.session.authUser.name = updatedUser.name;
  req.session.authUser.email = updatedUser.email;

  res.render('vwAdmin/profile', {
    user: req.session.authUser,
    isAuthenticated: true,
    error: false,
    success: 'Cập nhật thông tin thành công!',
  });
}

/**
 * UC [22] Change Password — Admin
 * Class Diagram: User.changePassword()
 */
export async function changePwd(req, res) {
  const id = req.body.id;
  const currentPassword = req.body.currentPassword || '';
  const newPassword = req.body.newPassword || '';

  const ok = bcrypt.compareSync(currentPassword, req.session.authUser.password);
  if (!ok) {
    return res.render('vwAdmin/profile', {
      layout: 'admin',
      user: req.session.authUser,
      isAuthenticated: true,
      error: 'Mật khẩu hiện tại không đúng.',
      success: false,
    });
  }

  if (newPassword.length < 6) {
    return res.render('vwAdmin/profile', {
      user: req.session.authUser,
      isAuthenticated: true,
      error: 'Mật khẩu mới phải tối thiểu 6 ký tự.',
      success: false,
    });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  await UserDao.changePassword(id, hashed);
  req.session.authUser.password = hashed;

  res.render('vwAdmin/profile', {
    layout: 'admin',
    user: req.session.authUser,
    isAuthenticated: true,
    error: false,
    success: 'Đổi mật khẩu thành công!',
  });
}
