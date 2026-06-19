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
}

export default Lecture;
