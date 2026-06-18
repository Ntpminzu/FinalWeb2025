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

import db from '../utils/db.js';

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

  // ═══════════════════════════════════════════
  // Static Methods
  // ═══════════════════════════════════════════

  static find(userId, lectureId) {
    return db('lecture_progress')
      .where({ user_id: userId, lecture_id: lectureId })
      .first();
  }

  static async upsert(userId, lectureId, payload) {
    const row = await Progress.find(userId, lectureId);
    if (row) {
      return db('lecture_progress')
        .where({ user_id: userId, lecture_id: lectureId })
        .update(payload);
    }
    return db('lecture_progress').insert({
      user_id: userId,
      lecture_id: lectureId,
      ...payload
    });
  }

  static async courseCompletion(userId, courseId) {
    const total = await db('lectures')
      .where({ course_id: courseId })
      .count('* as c').first().then(r => Number(r.c) || 0);

    const done = await db('lecture_progress as p')
      .join('lectures as l', 'l.id', 'p.lecture_id')
      .where('p.user_id', userId)
      .andWhere('l.course_id', courseId)
      .andWhere('p.is_completed', true)
      .count('* as c').first().then(r => Number(r.c) || 0);

    const percent = total ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }
}

export default Progress;
