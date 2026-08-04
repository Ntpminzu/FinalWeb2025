import db from '../utils/db.js';
import Feedback from '../models/feedback.model.js';

class FeedbackDao {
  static async findByUserCourse(userId, courseId) {
    const row = await db('feedback')
      .where({ user_id: userId, course_id: courseId })
      .first();
    return row ? new Feedback(row) : null;
  }

  static async upsert(userId, courseId, rating, comment) {
    const existed = await FeedbackDao.findByUserCourse(userId, courseId);
    const payload = {
      rating: Number(rating),
      comment: comment ?? '',
      created_at: db.fn.now()
    };
    if (existed) {
      return db('feedback')
        .where({ user_id: userId, course_id: courseId })
        .update(payload);
    }
    return db('feedback').insert({
      user_id: userId,
      course_id: courseId,
      ...payload,
    });
  }

  static insert(userId, courseId, rating, comment) {
    return db('feedback').insert({
      user_id: userId,
      course_id: courseId,
      rating: Number(rating),
      comment: comment ?? '',
      created_at: db.fn.now(),
    });
  }

  static update(userId, courseId, rating, comment) {
    return db('feedback')
      .where({ user_id: userId, course_id: courseId })
      .update({
        rating: Number(rating),
        comment: comment ?? '',
        created_at: db.fn.now(),
      });
  }

  static listByCourse(courseId) {
    return db('feedback as f')
      .leftJoin('users as u', 'u.id', 'f.user_id')
      .where('f.course_id', courseId)
      .select('f.*', 'u.name as user_name')
      .orderBy('f.created_at', 'desc');
  }

  static remove(userId, courseId) {
    return db('feedback')
      .where({ user_id: userId, course_id: courseId })
      .del();
  }

  static findByCourse(courseId) {
    return db('feedback as f')
      .join('users as u', 'u.id', 'f.user_id')
      .where('f.course_id', courseId)
      .select(
        'u.name as student_name',
        'f.rating',
        'f.comment',
        'f.created_at'
      )
      .orderBy('f.created_at', 'desc');
  }
}

export default FeedbackDao;
