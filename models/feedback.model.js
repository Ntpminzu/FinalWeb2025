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

import Rate, { isValidRate } from '../enums/Rate.js';


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
    if (this.rating !== null && !isValidRate(this.rating)) {
      throw new Error('Invalid rating value');
    }
    return true;
  }
}

export default Feedback;