import db from '../utils/db.js';
import Wishlist from '../models/watchlist.model.js';

class WatchlistDao {
  static add({ user_id, course_id, course_title = null }) {
    return db('watchlist')
      .insert({ user_id, course_id, course_title })
      .onConflict(['user_id', 'course_id'])
      .ignore()
      .returning('*');
  }

  static async isInWatchlist(user_id, course_id) {
    const row = await db('watchlist')
      .where({ user_id, course_id })
      .first();
    return row ? new Wishlist(row) : null;
  }

  static findAllByUser(user_id) {
    return db('watchlist as w')
      .leftJoin('courses as c', 'w.course_id', 'c.id')
      .where('w.user_id', user_id)
      .select(
        'w.id',
        'w.user_id',
        'w.course_id',
        'w.added_at',
        'w.course_title',

        'c.title',
        'c.thumbnail',
        'c.short_desc',
        'c.full_desc',
        'c.price',
        'c.sale_price',
        'c.rating_avg',
        'c.rating_count',
        'c.student_count',
        'c.category_id',
        'c.instructor_id',
        'c.created_at',
        'c.updated_at'
      )
      .orderBy('w.added_at', 'desc');
  }

  static remove(user_id, course_id) {
    return db('watchlist')
      .where({ user_id, course_id })
      .del();
  }

  static async findById(id, user_id) {
    const row = await db('watchlist')
      .where({ id, user_id })
      .first();
    return row ? new Wishlist(row) : null;
  }

  static countByUser(user_id) {
    return db('watchlist')
      .where({ user_id })
      .count('id as total')
      .first();
  }
}

export default WatchlistDao;
