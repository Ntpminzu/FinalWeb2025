/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Progress Model (Không có trong Class Diagram)              ║
 * ║                                                              ║
 * ║  Lưu ý: Model này không có class tương ứng trong diagram.   ║
 * ║  Được giữ lại vì cần thiết cho:                              ║
 * ║    - UC [10] Watch Lecture → saveProgress()                  ║
 * ║    - UC [09] View Purchased Courses → courseCompletion()     ║
 * ║    - UC [11] Review Course → kiểm tra quyền đánh giá        ║
 * ║                                                              ║
 * ║  Bảng DB: lecture_progress                                   ║
 * ║    - user_id, lecture_id, last_second,                       ║
 * ║      watched_percent, is_completed                           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */



/**
 * Entity class Progress (lecture_progress).
 */
class Progress {

  // ─── Tương đương @Column trong Spring Boot ───

  /** @Column(name = "user_id", primaryKey = true) */
  user_id;

  /** @Column(name = "lecture_id", primaryKey = true) */
  lecture_id;

  /** @Column(name = "last_second", nullable = true) */
  last_second;

  /** @Column(name = "watched_percent", nullable = true) */
  watched_percent;

  /** @Column(name = "is_completed", nullable = true, default = false) */
  is_completed;

  // ─── Constructor ───

  constructor(data = {}) {
    this.user_id = data.user_id || null;
    this.lecture_id = data.lecture_id || null;
    this.last_second = data.last_second || 0;
    this.watched_percent = data.watched_percent || 0;
    this.is_completed = data.is_completed || false;
  }
}

export default Progress;
