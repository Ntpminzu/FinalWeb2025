import db from '../utils/db.js';
import Lecture from '../models/lecture.model.js';

class LectureDao {
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

  static async findById(lectureId) {
    const row = await db('lectures')
      .where('id', lectureId)
      .first();
    return row ? new Lecture(row) : null;
  }

  static updateDurationIfMissing(lectureId, sec) {
    return db('lectures')
      .where('id', lectureId)
      .andWhere(query => query.whereNull('duration_sec').orWhere('duration_sec', '<=', 0))
      .update({ duration_sec: sec });
  }
}

export default LectureDao;
