import db from '../utils/db.js';
export function findAllCourses() {
  return db('purchased as p')
    .leftJoin('courses as c', 'p.course_id', 'c.id')
    .select(
      'p.id',
      'p.course_id',
      'p.course_title',
      'c.thumbnail',
      'c.short_desc',
      'c.price',
      'c.sale_price',
      'p.purchased_at'
    )
    .orderBy('p.id', 'desc');
}
