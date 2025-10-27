import db from '../utils/db.js';

export function isPurchased(userId, courseId) {
  return db('purchased')
    .where({ user_id: userId, course_id: courseId })
    .first();
}

export function add(userId, courseId, course_title) {
  return db('purchased').insert({
    user_id: userId,
    course_id: courseId,
    course_title
  });
}

export function listByUser(userId) {
  return db('purchased as p')
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
}

export async function findCourseIdsByUserId(userId) {
  const rows = await db('purchased')
    .where('user_id', userId)
    .select('course_id');

  return rows.map(r => String(r.course_id));
}

/** Thêm nhiều bản ghi purchased một lần */
export function addMany(rows) {
  // rows: [{ user_id, course_id, course_title, purchased_at? }, ...]
  return db('purchased').insert(rows);
}

/** (Tuỳ chọn) Thêm nhiều bản ghi nhưng BỎ QUA nếu trùng (Postgres) */
export function addManyIgnoreConflicts(rows) {
  // YÊU CẦU: trên bảng purchased có unique index (user_id, course_id)
  // CREATE UNIQUE INDEX purchased_user_course_uq ON purchased(user_id, course_id);
  return db('purchased')
    .insert(rows)
    .onConflict(['user_id', 'course_id'])
    .ignore();
}

/** (Tuỳ chọn) Upsert: nếu đã có thì cập nhật course_title & purchased_at */
export function upsertMany(rows) {
  // Postgres only
  return db('purchased')
    .insert(rows)
    .onConflict(['user_id', 'course_id'])
    .merge({
      course_title: db.raw('EXCLUDED.course_title'),
      purchased_at: db.fn.now(),
    });
}

/** Đếm số khoá học đã mua của user */
export async function countByUser(userId) {
  const row = await db('purchased')
    .where('user_id', userId)
    .count({ cnt: 'id' })
    .first();
  return Number(row?.cnt || 0);
}

/** Xoá 1 bản ghi purchased theo user & course */
export function remove(userId, courseId) {
  return db('purchased')
    .where({ user_id: userId, course_id: courseId })
    .del();
}