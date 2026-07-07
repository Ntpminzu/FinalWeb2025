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


/**
 * Role class Admin — Kế thừa User, đại diện cho Admin (permission = 3).
 */
class Admin extends User {
  constructor(data = {}) {
    super(data);
    this.permission = 3; // Mặc định admin
  }

}

export default Admin;