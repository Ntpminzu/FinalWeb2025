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
}

export default Wishlist;
