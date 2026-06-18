/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Feedback — Class Diagram                          ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - id: int                                                 ║
 * ║    - user_id: int                                            ║
 * ║    - course_id: int                                          ║
 * ║    - rating: Rate (enum 1–5)                                 ║
 * ║    - comment: string                                         ║
 * ║                                                              ║
 * ║  Methods:                                                    ║
 * ║    + upsert(uId,cId,rating,txt): void    ✅                 ║
 * ║    + findByUserCourse(uId,cId): Feedback ✅                 ║
 * ║    + listByCourse(cId): List             ✅                 ║
 * ║    + remove(uId,cId): bool               ✅                 ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Feedback ────→ Rate (enum)                                ║
 * ║    Feedback ────→ User (via user_id)                         ║
 * ║    Feedback ────→ Course (via course_id)                     ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [11] Review Course                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import db from '../utils/db.js';
import Rate from '../enums/Rate.js';

/**
 * Entity class Feedback — tương đương @Entity trong Spring Boot.
 * Bảng DB: "feedback"
 */
class Feedback {

  // ─── Tương đương @Column trong Spring Boot ───

  /** @Column(name = "id", primaryKey = true, autoIncrement = true) */
  id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "user_id", referencedColumnName = "id")
   */
  user_id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "course_id", referencedColumnName = "id")
   */
  course_id;

  /**
   * @Enumerated(Rate)
   * @Column(name = "rating", nullable = false)
   */
  rating;

  /** @Column(name = "comment", nullable = true, columnDefinition = "TEXT") */
  comment;

  /** @Column(name = "created_at", nullable = false, default = CURRENT_TIMESTAMP) */
  created_at;

  // ─── Constructor ───

  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || null;
    this.course_id = data.course_id || null;
    this.rating = data.rating || null;
    this.comment = data.comment || null;
    this.created_at = data.created_at || null;
  }

  validate() {
    if (!this.user_id) {
      throw new Error('User ID must not be empty');
    }
    if (!this.course_id) {
      throw new Error('Course ID must not be empty');
    }
    if (this.rating !== null && !Rate.isValidRate(this.rating)) {
      throw new Error('Invalid rating value');
    }
    return true;
  }

  // ═══════════════════════════════════════════
  // Static Methods — Tương đương @Repository
  // ═══════════════════════════════════════════

  // ─── Class Diagram: Feedback.findByUserCourse(uId, cId) ───
  /**
   * Tìm đánh giá của một user cho một khóa học cụ thể.
   * UC [11]: Kiểm tra Actor đã đánh giá chưa (Exception 3.1).
   */
  static findByUserCourse(userId, courseId) {
    return db('feedback')
      .where({ user_id: userId, course_id: courseId })
      .first();
  }

  // ─── Class Diagram: Feedback.upsert(uId, cId, rating, txt) ── UC [11] ───
  /**
   * Thêm hoặc cập nhật đánh giá (upsert).
   * UC [11]: Actor chọn số sao + nhập nhận xét → lưu/cập nhật.
   * Exception 3.1: Nếu đã đánh giá → cho phép chỉnh sửa.
   */
  static async upsert(userId, courseId, rating, comment) {
    const existed = await Feedback.findByUserCourse(userId, courseId);
    const payload = {
      rating: Number(rating),
      comment: comment ?? '',
      created_at: db.fn.now()
    };
    if (existed) {
      return db('feedback')
        .where({ user_id: userId, course_id: courseId })
        .update(payload);
    }
    return db('feedback').insert({
      user_id: userId,
      course_id: courseId,
      ...payload,
    });
  }

  // ─── Class Diagram: Feedback.listByCourse(cId) ───
  /**
   * Lấy danh sách đánh giá của một khóa học.
   * UC [03] View Course Details — hiển thị đánh giá của sinh viên.
   */
  static listByCourse(courseId) {
    return db('feedback as f')
      .leftJoin('users as u', 'u.id', 'f.user_id')
      .where('f.course_id', courseId)
      .select('f.*', 'u.name as user_name')
      .orderBy('f.created_at', 'desc');
  }

  // ─── Class Diagram: Feedback.remove(uId, cId) ───
  /**
   * Xóa đánh giá.
   */
  static remove(userId, courseId) {
    return db('feedback')
      .where({ user_id: userId, course_id: courseId })
      .del();
  }

  /**
   * Lấy danh sách đánh giá kèm tên sinh viên.
   * Dùng cho trang chi tiết khóa học.
   */
  static findByCourse(courseId) {
    return db('feedback as f')
      .join('users as u', 'u.id', 'f.user_id')
      .where('f.course_id', courseId)
      .select(
        'u.name as student_name',
        'f.rating',
        'f.comment',
        'f.created_at'
      )
      .orderBy('f.created_at', 'desc');
  }
}

export default Feedback;