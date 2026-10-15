import db from '../../../config/database.js';

export default class CartRepository {
  static list(userId, connection = db) {
    const query = connection('cart_items as cart').join('courses as c', 'c.id', 'cart.course_id')
      .where('cart.user_id', userId).select('c.*').orderBy('cart.added_at').orderBy('c.id');
    return connection === db ? query : query.forShare('c');
  }
  static add(userId, courseId, connection = db) {
    return connection('cart_items').insert({ user_id: userId, course_id: courseId }).onConflict(['user_id', 'course_id']).ignore();
  }
  static remove(userId, courseId, connection = db) {
    return connection('cart_items').where({ user_id: userId, course_id: courseId }).del();
  }
  static clear(userId, connection = db) {
    return connection('cart_items').where({ user_id: userId }).del();
  }
  static findCourses(ids, connection = db) {
    return connection('courses').whereIn('id', ids).select('*').forShare();
  }
}
