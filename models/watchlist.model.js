// src/models/watchlist.model.js
import db from '../utils/db.js';

/**
 * Thêm 1 khóa học vào watchlist.
 * - Tránh trùng course_id bằng onConflict(...).ignore()
 * - Trả về bản ghi vừa thêm (nếu thêm mới), hoặc [] nếu đã tồn tại
 */
export function add(course_id, course_title) {
  return db('watchlist')
    .insert({ course_id, course_title })
    .onConflict('course_id')     // yêu cầu Postgres ≥ 9.5
    .ignore()
    .returning('*');
}

/** Kiểm tra 1 khóa học đã có trong watchlist chưa */
export function isInWatchlist(course_id) {
  return db('watchlist')
    .where({ course_id })
    .first();
}

/**
 * Lấy danh sách watchlist (kèm thông tin khóa học để hiện đẹp ở UI)
 * Nếu chỉ muốn đúng dữ liệu watchlist thì bỏ phần join.
 */
export function findAll() {
  return db('watchlist as w')
    .leftJoin('courses as c', 'w.course_id', 'c.id')
    .select(
      'w.id',
      'w.course_id',
      'w.course_title',
      'w.added_at',
      'c.thumbnail',
      'c.short_desc',
      'c.price',
      'c.sale_price',
      'c.description'
    )
    .orderBy('w.added_at', 'desc');
}

/** Xóa 1 mục khỏi watchlist theo course_id */
export function remove(course_id) {
  return db('watchlist')
    .where({ course_id })
    .del();
}

/** (Tuỳ chọn) Lấy 1 dòng watchlist theo id */
export function findById(id) {
  return db('watchlist')
    .where({ id })
    .first();
}
