import db from '../utils/db.js';
import Progress from '../models/progress.model.js';

class ProgressDao {
  static async find(userId, lectureId) {
    const row = await db('lecture_progress')
      .where({ user_id: userId, lecture_id: lectureId })
      .first();
    return row ? new Progress(row) : null;
  }

  static async upsert(userId, lectureId, payload) {
    const row = await ProgressDao.find(userId, lectureId);
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

export default ProgressDao;
