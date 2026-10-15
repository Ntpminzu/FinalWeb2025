import db from '../../../config/database.js';
import Progress from '../domain/progress.model.js';

class ProgressRepository {
  static findByCourse(userId, courseId) {
    return db('lectures as l').leftJoin('lecture_progress as p', function () {
      this.on('p.lecture_id', '=', 'l.id').andOn('p.user_id', '=', db.raw('?', [userId]));
    }).where('l.course_id', courseId).select('l.id as lecture_id', 'p.last_second', 'p.watched_percent', 'p.is_completed');
  }
  static async find(userId, lectureId) {
    const row = await db('lecture_progress')
      .where({ user_id: userId, lecture_id: lectureId })
      .first();
    return row ? new Progress(row) : null;
  }

  static async upsert(userId, lectureId, payload) {
    const [row] = await db('lecture_progress').insert({
      user_id: userId,
      lecture_id: lectureId,
      ...payload
    }).onConflict(['user_id', 'lecture_id']).merge({
      last_second: db.raw('GREATEST(lecture_progress.last_second, EXCLUDED.last_second)'),
      watched_percent: db.raw('GREATEST(lecture_progress.watched_percent, EXCLUDED.watched_percent)'),
      is_completed: db.raw('lecture_progress.is_completed OR EXCLUDED.is_completed'),
    }).returning('*');
    return new Progress(row);
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

export default ProgressRepository;
