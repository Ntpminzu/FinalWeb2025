/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» User — Class Diagram                              ║
 * ║                                                              ║
 * ║  Tương đương @Entity @Table("users") trong Spring Boot       ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    # id: int              (PK, auto-increment)               ║
 * ║    # username: String     (unique, not null)                  ║
 * ║    # name: String         (not null)                          ║
 * ║    # email: String        (unique, not null)                  ║
 * ║    # password: string     {bcrypt}                            ║
 * ║    # dob: Date                                               ║
 * ║    # permission: Permission (enum 1|2|3)                     ║
 * ║    # is_disabled: bool    (default: false)                   ║
 * ║                                                              ║
 * ║  Quan hệ kế thừa:                                           ║
 * ║    Student  (permission=1) ◁── User                          ║
 * ║    Instructor (permission=2) ◁── User                        ║
 * ║    Admin    (permission=3) ◁── User                          ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [01] Register, [02] Login, [21] Manage Profile,           ║
 * ║    [22] Change Password                                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import Permission from '../enums/Permission.js';


/**
 * Entity class User — tương đương @Entity trong Spring Boot.
 * Bảng DB: "users"
 */
class User {

  // ─── Tương đương @Column trong Spring Boot ───

  /** @Column(name = "id", primaryKey = true, autoIncrement = true) */
  id;

  /** @Column(name = "username", nullable = false, unique = true) */
  username;

  /** @Column(name = "name", nullable = false) */
  name;

  /** @Column(name = "email", nullable = false, unique = true) */
  email;

  /** @Column(name = "password", nullable = false) — lưu dưới dạng bcrypt hash */
  password;

  /** @Column(name = "dob", nullable = true) */
  dob;

  /**
   * @Enumerated(Permission)
   * @Column(name = "permission", nullable = false, default = 1)
   * Giá trị: 1 = STUDENT, 2 = INSTRUCTOR, 3 = ADMIN
   */
  permission;

  /** @Column(name = "is_disabled", nullable = false, default = false) */
  is_disabled;

  // ─── Constructor (tương đương constructor có validation trong Spring Boot) ───

  /**
   * @param {Object} data - Dữ liệu khởi tạo User
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || null;
    this.name = data.name || null;
    this.email = data.email || null;
    this.password = data.password || null;
    this.dob = data.dob || null;
    this.permission = data.permission || Permission.STUDENT;
    this.is_disabled = data.is_disabled || false;
  }

  /**
   * Validate dữ liệu của Entity trước khi lưu (tương đương @Valid trong Spring Boot).
   * Đối tượng User tự đảm bảo các bất biến (invariant) nghiệp vụ.
   * UC [01] Exception Flow — 4.1 thiếu trường, 4.2 mật khẩu ngắn, 4.4 email sai định dạng.
   * Lưu ý: gọi validate() trên mật khẩu DẠNG GỐC (chưa băm) để kiểm được độ dài.
   */
  validate() {
    if (!this.username || this.username.trim() === '') {
      throw new Error('Vui lòng nhập tên đăng nhập.');
    }
    if (!this.email || this.email.trim() === '') {
      throw new Error('Vui lòng nhập email.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      throw new Error('Email không hợp lệ.');
    }
    if (!this.password || this.password.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    }
    if (!Object.values(Permission).includes(this.permission)) {
      throw new Error('Quyền không hợp lệ.');
    }
    return true;
  }
}


export default User;