/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Lecture — Class Diagram                           ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - id: int                                                 ║
 * ║    - title: string                                           ║
 * ║    - video_url: string                                       ║
 * ║                                                              ║
 * ║  Methods:                                                    ║
 * ║    + findByCourse(cId): List         ✅                      ║
 * ║    + findById(id): Lecture           ✅                      ║
 * ║    + updateDuration(id,sec): void    ✅                      ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Course ◆──── 0..* Lecture (composition)                   ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [10] Watch Lecture, [14] Manage Lecture                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import db from '../utils/db.js';

/**
 * Entity class Lecture — tương đương @Entity trong Spring Boot.
 * Bảng DB: "lectures"
 */
class Lecture {

  // ─── Tương đương @Column trong Spring Boot ───

  /** @Column(name = "id", primaryKey = true, autoIncrement = true) */
  id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "course_id", referencedColumnName = "id")
   * Quan hệ composition: Course ◆──── 0..* Lecture
   */
  course_id;

  /** @Column(name = "title", nullable = false) */
  title;

  /** @Column(name = "video_url", nullable = true) */
  video_url;

  /** @Column(name = "duration_sec", nullable = true) */
  duration_sec;

  /** @Column(name = "order_index", nullable = true) */
  order_index;

  // ─── Constructor ───

  constructor(data = {}) {
    this.id = data.id || null;
    this.course_id = data.course_id || null;
    this.title = data.title || null;
    this.video_url = data.video_url || null;
    this.duration_sec = data.duration_sec || 0;
    this.order_index = data.order_index || 0;
  }

  validate() {
    if (!this.title || this.title.trim() === '') {
      throw new Error('Title must not be blank');
    }
    return true;
  }

  // ═══════════════════════════════════════════
  // Static Methods — Tương đương @Repository
  // ═══════════════════════════════════════════

  // ─── Class Diagram: Lecture.findByCourse(cId) ── UC [10] Watch Lecture ───
  /**
   * Lấy danh sách bài giảng theo khóa học.
   * UC [10]: Student chọn bài giảng → hệ thống hiển thị danh sách.
   */
  static findByCourse(courseId) {
    return db('lectures')
      .where('course_id', courseId)
      .select(
        'id',
        'title',
        'video_url',
        db.raw('duration_sec as duration_sec'),
        db.raw('order_index as ord')
      )
      .orderBy('order_index', 'asc');
  }

  // ─── Class Diagram: Lecture.findById(id) ───
  /**
   * Lấy thông tin chi tiết một bài giảng.
   */
  static findById(lectureId) {
    return db('lectures')
      .where('id', lectureId)
      .first();
  }

  // ─── Class Diagram: Lecture.updateDuration(id, sec) ───
  /**
   * Cập nhật thời lượng bài giảng (giây).
   * Được gọi tự động khi Student xem video lần đầu.
   */
  static updateDuration(lectureId, sec) {
    return db('lectures').where('id', lectureId).update({ duration_sec: sec });
  }
}

export default Lecture;
