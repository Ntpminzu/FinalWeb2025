// controllers/admin.controller.js

import bcrypt from 'bcryptjs';
import * as userModel from '../models/user.model.js';
import * as adminModel from '../models/admin.model.js';
import * as categoryModel from '../models/category.model.js';
import * as courseModel from '../models/course.model.js';
import db from '../utils/db.js';

/** 🏠 Dashboard */
export async function dashboard(req, res) {
  const stats = await adminModel.getDashboardStats?.() ?? {};
  const topCategories = await adminModel.getTopCategories?.() ?? [];
  const courseStatuses = await adminModel.getCourseStatuses?.() ?? [];

  res.render('vwAdmin/home', {
    layout: false,
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    stats,
    topCategories,
    courseStatuses,
  });
}

/** 👥 Quản lý người dùng */
export async function listUsers(req, res) {
  const teachers = await userModel.findTeachers();
  const students = await userModel.findStudents();

  res.render('vwAdmin/users', {
    teachers,
    students,
  });
}

/** 🚀 Cấp quyền giáo viên */
export async function makeTeacher(req, res) {
  const { id } = req.params;
  await userModel.promoteToTeacher(id);
  res.redirect('/admin/users');
}

/** 🚫 Khóa / Mở khóa tài khoản người dùng */
export async function disableUser(req, res) {
  const { id } = req.params;
  const disable = req.body.disable === 'true';
 
  try {
    if (typeof userModel.toggleDisable === 'function') {
      await userModel.toggleDisable(id, disable);
    } else {
      await db('users').where('id', id).update({ is_disabled: disable });
    }

    res.redirect('/admin/users');
  } catch (err) {
    console.error('❌ Lỗi khi khóa/mở khóa user:', err);
    res.status(500).send('Không thể thay đổi trạng thái tài khoản.');
  }
}

/** 🗑️ Xóa người dùng */
export async function deleteUser(req, res) {
  const { id } = req.params;
  await userModel.deleteById(id);
  res.redirect('/admin/users');
}

/** 📚 Quản lý khóa học */
export async function listCourses(req, res) {
  try {
    const [courses, categories] = await Promise.all([
      courseModel.getAllWithCategoryAndTeacher(),
      categoryModel.getAllWithCourseCount(),
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

/** 🗑️ Xóa khóa học */
export async function deleteCourse(req, res) {
  const { id } = req.params;
  await courseModel.deleteById(id);
  res.redirect('/admin/courses');
}

/** 🚫 Đình chỉ / Khôi phục khóa học */
export async function disableCourse(req, res) {
  const courseId = req.params.id;
  const disable = req.body.disable === 'true';

  try {
    if (typeof courseModel.toggleDisable === 'function') {
      await courseModel.toggleDisable(courseId, disable);
    } else {
      await db('courses').where('id', courseId).update({ is_disabled: disable });
    }

    return res.redirect('/admin/courses');
  } catch (err) {
    console.error('❌ Lỗi khi disable khóa học:', err);
    return res.status(500).send('Lỗi khi đình chỉ / mở lại khóa học');
  }
}

/** 🗂️ Quản lý danh mục */
export async function listCategories(req, res) {
  const categories = await categoryModel.getAllWithCourseCount();
  res.render('vwAdmin/categories', { categories });
}

export async function addCategory(req, res) {
  const name = req.body.name?.trim();
  if (name) await categoryModel.add({ name });
  res.redirect('/admin/categories');
}

export async function editCategory(req, res) {
  const { id, name } = req.body;
  if (id && name?.trim()) {
    await categoryModel.patch(id, { name: name.trim() });
  }
  res.redirect('/admin/categories');
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.body;
    await categoryModel.remove(id);
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.render('admin/categories', { error: 'Lỗi khi xóa lĩnh vực' });
  }
}

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
  await userModel.patch(id, updatedUser);
  req.session.authUser.name = updatedUser.name;
  req.session.authUser.email = updatedUser.email;

  res.render('vwAdmin/profile', {
    user: req.session.authUser,
    isAuthenticated: true,
    error: false,
    success: 'Cập nhật thông tin thành công!',
  });
}

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
  await userModel.patch(id, { password: hashed });
  req.session.authUser.password = hashed;

  res.render('vwAdmin/profile', {
    layout: 'admin',
    user: req.session.authUser,
    isAuthenticated: true,
    error: false,
    success: 'Đổi mật khẩu thành công!',
  });
}
