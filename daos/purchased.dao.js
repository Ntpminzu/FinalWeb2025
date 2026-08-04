import db from '../utils/db.js';
import Purchased from '../models/purchased.model.js';

class PurchasedDao {
  static async findAllByUser(userId) {
    const rows = await db('purchased as p')
      .leftJoin('courses as c', 'p.course_id', 'c.id')
      .where('p.user_id', userId)
      .select(
        'p.course_id',
        'p.course_title',
        'p.purchased_at',
        'c.thumbnail',
        'c.short_desc',
        'c.price',
        'c.sale_price'
      )
      .orderBy('p.purchased_at', 'desc');
    return rows;
  }

  static async findByUserAndCourse(userId, courseId) {
    const row = await db('purchased')
      .where({ user_id: userId, course_id: courseId })
      .first();
    return row ? new Purchased(row) : null;
  }

  static async findOwnedCourseIds(userId, trx = db) {
    const rows = await trx('purchased')
      .where('user_id', userId)
      .select('course_id');
    return rows.map(r => r.course_id);
  }

  static async addMultiple(userId, courses, trx = db) {
    if (!courses || courses.length === 0) return;
    const now = new Date();
    const rows = courses.map(c => ({
      user_id: userId,
      course_id: c.id,
      course_title: c.title,
      purchased_at: now
    }));
    await trx('purchased').insert(rows).onConflict(['user_id', 'course_id']).ignore();
  }
}

export default PurchasedDao;
