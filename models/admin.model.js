/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «role» Admin — Class Diagram (permission=3)                ║
 * ║  Kế thừa: User                                              ║
 * ║                                                              ║
 * ║  Methods:                                                    ║
 * ║    + manageUsers(): List             → see admin.controller  ║
 * ║    + promoteToInstructor(id): bool   → see user.model        ║
 * ║    + disableUser(id,state): bool     → see user.model        ║
 * ║    + deleteUser(id): bool            → see user.model        ║
 * ║    + manageCourses(): List           → see admin.controller  ║
 * ║    + disableCourse(id,state): bool   → see course.model      ║
 * ║    + deleteCourse(id): bool          → see course.model      ║
 * ║    + manageCategories(): List        → see admin.controller  ║
 * ║    + addCategory(name): Category     → see category.model    ║
 * ║    + editCategory(id,name): bool     → see category.model    ║
 * ║    + deleteCategory(id): bool        → see category.model    ║
 * ║    + viewDashboard(): DashboardStats → getDashboardStats()   ║
 * ║                                                              ║
 * ║  Lưu ý:                                                     ║
 * ║    Admin không có bảng riêng trong DB. Các method quản lý    ║
 * ║    user/course/category được delegate sang model tương ứng.  ║
 * ║    File này chỉ chứa logic đặc thù cho Admin Dashboard.     ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [17] Manage Users, [19] Manage Courses (Admin),           ║
 * ║    [20] Manage Categories                                    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import User from './user.model.js';
import db from '../utils/db.js';

/**
 * Role class Admin — Kế thừa User, đại diện cho Admin (permission = 3).
 */
class Admin extends User {
  constructor(data = {}) {
    super(data);
    this.permission = 3; // Mặc định admin
  }

  // ═══════════════════════════════════════════
  // Static Methods — Tương thực Dashboard
  // ═══════════════════════════════════════════

  // ─── Class Diagram: Admin.viewDashboard() ───
  /**
   * Lấy thống kê tổng quan cho Admin Dashboard.
   * Gồm: tổng khóa học, tổng sinh viên, tổng giảng viên, tổng danh mục.
   */
  static async getDashboardStats() {
    const [totalCourses] = await db('courses').count('id as total');
    const totalStudents = await db('users').where('permission', '=', 1).count('id as total').first();
    const [totalInstructors] = await db('users').where('permission', 2).count('id as total');
    const [totalCategories] = await db('categories').count('id as total');

    return {
      totalCourses: Number(totalCourses?.total || 0),
      totalStudents: Number(totalStudents?.total || 0),
      totalInstructors: Number(totalInstructors?.total || 0),
      totalCategories: Number(totalCategories?.total || 0),
    };
  }

  /**
   * Lấy top danh mục có nhiều khóa học nhất.
   * Phục vụ Dashboard chart/widget.
   */
  static async getTopCategories(limit = 5) {
    return db('categories as cat')
      .leftJoin('courses as c', 'c.category_id', 'cat.id')
      .select('cat.catname as name')
      .count('c.id as count')
      .groupBy('cat.id', 'cat.catname')
      .orderBy('count', 'desc')
      .limit(limit);
  }

  /**
   * Đếm số khóa học theo trạng thái.
   * Phục vụ Dashboard chart/widget.
   */
  static async getCourseStatuses() {
    const [published] = await db('courses').where('is_disabled', false).count('id as count');
    const [disabled] = await db('courses').where('is_disabled', true).count('id as count');

    return {
      Published: Number(published?.count || 0),
      Disabled: Number(disabled?.count || 0),
    };
  }
}

export default Admin;