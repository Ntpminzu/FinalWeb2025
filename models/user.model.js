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

import db from '../utils/db.js';
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
   * Validate dữ liệu trước khi lưu (tương đương @Valid trong Spring Boot).
   * UC [01] Exception Flow: 4.1 thiếu trường, 4.4 email không hợp lệ.
   */
  validate() {
    if (!this.username || this.username.trim() === '') {
      throw new Error('Username must not be blank');
    }
    if (!this.email || this.email.trim() === '') {
      throw new Error('Email must not be blank');
    }
    if (!this.password || this.password.trim() === '') {
      throw new Error('Password must not be blank');
    }
    if (!Object.values(Permission).includes(this.permission)) {
      throw new Error('Invalid permission value');
    }
    return true;
  }

  // ═══════════════════════════════════════════
  // Static Methods — Tương đương @Repository trong Spring Boot
  // (JpaRepository<User, Integer>)
  // ═══════════════════════════════════════════

  // ─── User.register() ── UC [01] Register ───
  /**
   * Tạo tài khoản mới.
   * Tương đương: userRepository.save(user)
   */
  static async register(userData) {
    const user = new User(userData);
    const [result] = await db('users').insert({
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password,
      dob: user.dob,
      permission: user.permission,
      is_disabled: user.is_disabled,
    }).returning('*');
    return new User(result);
  }

  // Alias cho tương thích code cũ
  static add(userData) {
    return User.register(userData);
  }

  // ─── User.login() ── UC [02] Login ───
  // Logic xác thực nằm tại controllers/account.controller.js
  // Model cung cấp hàm tìm user để controller so khớp mật khẩu.

  /**
   * Tìm user theo username.
   * Tương đương: userRepository.findByUsername(username)
   */
  static async findByUsername(username) {
    const row = await db('users').where('username', username).first();
    return row ? new User(row) : null;
  }

  /**
   * Tìm user theo name.
   * Tương đương: userRepository.findByName(name)
   */
  static async findByName(name) {
    const row = await db('users').where('name', name).first();
    return row ? new User(row) : null;
  }

  /**
   * Tìm user theo ID.
   * Tương đương: userRepository.findById(id)
   */
  static async findById(id) {
    const row = await db('users').where('id', id).first();
    return row ? new User(row) : null;
  }

  // ─── User.updateProfile() ── UC [21] Manage Profile ───
  /**
   * Cập nhật thông tin hồ sơ.
   * Tương đương: userRepository.save(user) — partial update
   */
  static updateProfile(id, data) {
    return db('users').where('id', id).update(data);
  }

  // Alias cho tương thích code cũ
  static patch(id, data) {
    return User.updateProfile(id, data);
  }

  // ─── User.changePassword() ── UC [22] Change Password ───
  /**
   * Đổi mật khẩu (lưu hash mới).
   */
  static changePassword(id, hashedPassword) {
    return db('users').where('id', id).update({ password: hashedPassword });
  }

  // ─── User.logout() ── UC [02] ───
  // Thực hiện bằng cách xoá session tại controller, không cần model.

  // ═══════════════════════════════════════════
  // Các method bổ trợ cho Admin (UC [17] Manage Users)
  // ═══════════════════════════════════════════

  /**
   * Lấy tất cả user.
   * Tương đương: userRepository.findAll()
   */
  static findAll() {
    return db('users');
  }

  /**
   * Lấy danh sách giảng viên (permission = 2).
   * Tương đương: userRepository.findByPermission(Permission.INSTRUCTOR)
   */
  static findTeachers() {
    return db('users')
      .where('permission', Permission.INSTRUCTOR)
      .select('id', 'name', 'email', 'dob', 'permission');
  }

  /**
   * Lấy danh sách học sinh (permission = 1).
   * Tương đương: userRepository.findByPermission(Permission.STUDENT)
   */
  static findStudents() {
    return db('users')
      .where('permission', Permission.STUDENT)
      .select('id', 'name', 'email', 'dob', 'permission');
  }

  /**
   * Cấp quyền giảng viên.
   * UC [17]: Admin → Promote to Instructor.
   */
  static promoteToTeacher(id) {
    return db('users').where({ id }).update({ permission: Permission.INSTRUCTOR });
  }

  /**
   * Xóa người dùng.
   * UC [17]: Admin → Delete Account.
   */
  static deleteById(id) {
    return db('users').where({ id }).del();
  }

  /**
   * Khóa / Mở khóa tài khoản.
   * UC [17]: Admin → Disable/Enable Account.
   */
  static toggleDisable(id, disable) {
    return db('users').where('id', id).update({ is_disabled: disable });
  }
}

export default User;