/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Wishlist — Class Diagram                          ║
 * ║  (File: watchlist.model.js — mapping Wishlist class)         ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - id: int {PK}                                            ║
 * ║    - user_id: int                                            ║
 * ║    - item: List<Course>                                      ║
 * ║                                                              ║
 * ║  Methods:                                                    ║
 * ║    + isInWatchlist(uId,cId): bool     ✅                     ║
 * ║    + add(uId,cId,title): Wishlist     ✅                     ║
 * ║    + remove(uId,cId): bool            ✅                     ║
 * ║    + findAllByUser(uId): List         ✅                     ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Wishlist ◇──── Course (aggregation)                       ║
 * ║    Wishlist ────→ User (via user_id)                         ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [12] Manage Watchlist                                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import db from '../utils/db.js';

/**
 * Entity class Wishlist — tương đương @Entity trong Spring Boot.
 * Bảng DB: "watchlist"
 */
class Wishlist {

  // ─── Tương đương @Column trong Spring Boot ───

  /** @Column(name = "id", primaryKey = true, autoIncrement = true) */
  id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "user_id", referencedColumnName = "id")
   */
  user_id;

  /**
   * @ManyToMany(fetch = LAZY)
   * Quan hệ aggregation: Wishlist ◇──── Course
   */
  course_id;

  /** @Column(name = "course_title", nullable = true) */
  course_title;

  /** @Column(name = "added_at", nullable = false, default = CURRENT_TIMESTAMP) */
  added_at;

  // ─── Constructor ───

  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || null;
    this.course_id = data.course_id || null;
    this.course_title = data.course_title || null;
    this.added_at = data.added_at || null;
  }

  validate() {
    if (!this.user_id) {
      throw new Error('User ID must not be empty');
    }
    if (!this.course_id) {
      throw new Error('Course ID must not be empty');
    }
    return true;
  }

  // ═══════════════════════════════════════════
  // Static Methods — Tương đương @Repository
  // ═══════════════════════════════════════════

  // ─── Class Diagram: Wishlist.add(uId, cId, title) ── UC [12] Thêm vào Wishlist ───
  /**
   * Thêm khóa học vào watchlist.
   * UC [12]: Actor nhấn biểu tượng "Thêm vào yêu thích".
   * Tránh trùng (user_id, course_id).
   */
  static add({ user_id, course_id, course_title = null }) {
    return db('watchlist')
      .insert({ user_id, course_id, course_title })
      .onConflict(['user_id', 'course_id'])
      .ignore()
      .returning('*');
  }

  // ─── Class Diagram: Wishlist.isInWatchlist(uId, cId) ───
  /**
   * Kiểm tra khóa học đã có trong watchlist chưa.
   * UC [12]: Hệ thống kiểm tra trước khi thêm.
   */
  static isInWatchlist(user_id, course_id) {
    return db('watchlist')
      .where({ user_id, course_id })
      .first();
  }

  // ─── Class Diagram: Wishlist.findAllByUser(uId) ── UC [12] Xem danh sách ───
  /**
   * Lấy danh sách watchlist của user kèm thông tin khóa học.
   * UC [12]: Actor nhấn "Danh sách yêu thích" → hiển thị danh sách.
   */
  static findAllByUser(user_id) {
    return db('watchlist as w')
      .leftJoin('courses as c', 'w.course_id', 'c.id')
      .where('w.user_id', user_id)
      .select(
        // watchlist fields
        'w.id',
        'w.user_id',
        'w.course_id',
        'w.added_at',
        'w.course_title', // vẫn giữ để tương thích, có thể null

        // course fields (theo bảng courses)
        'c.title',
        'c.thumbnail',
        'c.short_desc',
        'c.full_desc',
        'c.price',
        'c.sale_price',
        'c.rating_avg',
        'c.rating_count',
        'c.student_count',
        'c.category_id',
        'c.instructor_id',
        'c.created_at',
        'c.updated_at'
      )
      .orderBy('w.added_at', 'desc');
  }

  // ─── Class Diagram: Wishlist.remove(uId, cId) ── UC [12] Xóa khỏi Wishlist ───
  /**
   * Xóa khóa học khỏi watchlist.
   * UC [12]: Actor nhấn biểu tượng "Thùng rác" → hệ thống xóa.
   */
  static remove(user_id, course_id) {
    return db('watchlist')
      .where({ user_id, course_id })
      .del();
  }

  /** Lấy 1 dòng watchlist theo id nhưng ràng buộc user */
  static findById(id, user_id) {
    return db('watchlist')
      .where({ id, user_id })
      .first();
  }

  /** Đếm số mục watchlist của user */
  static countByUser(user_id) {
    return db('watchlist')
      .where({ user_id })
      .count('id as total')
      .first();
  }
}

export default Wishlist;
