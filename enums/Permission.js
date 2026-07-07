/**
 * «enum» Permission — Class Diagram
 *
 * Định nghĩa các mức quyền hạn trong hệ thống.
 *   1 = Student  (Sinh viên)
 *   2 = Instructor (Giảng viên)
 *   3 = Admin (Quản trị viên)
 *
 * Sử dụng: import Permission from '../enums/Permission.js';
 */
const Permission = Object.freeze({
  STUDENT: 1,
  INSTRUCTOR: 2,
  ADMIN: 3,
});

export default Permission;
