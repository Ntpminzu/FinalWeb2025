import db from '../utils/db.js';
function sanitizeFTS(input) {
  return (input || '')
    .replace(/[&|!():]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findPageAll(limit, offset) {
  return db('courses as c')
    .where('c.is_disabled', false)
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')

    // SỬA LẠI JOIN: Bỏ bảng 'instructors'
    .leftJoin('users as u', 'c.instructor_id', 'u.id')

    .select(
      'c.id', 'c.title', 'c.thumbnail', 'c.short_desc', 'c.description',
      'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count',
      'cat.catname as category',
      'u.name as instructor_name'
    )
    .orderBy('c.id', 'desc')
    .limit(limit)
    .offset(offset);
}

export async function countAll() {
  const result = await db('courses')
    .where('is_disabled', false)
    .count('* as total')
    .first();
  return result.total;
}

export function findById(id) {
  return db('courses as c')
    .where('c.is_disabled', false)
    .leftJoin('users as u', 'c.instructor_id', 'u.id')
    .leftJoin('instructors as i', 'i.user_id', 'u.id')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .select(
      'c.*',
      'u.name as instructor_name',
      'i.bio as instructor_bio',
      'i.specialization as instructor_specialization',
      'cat.catname as category_name'
    )
    .where('c.id', id)
    .first();
}

export function findPageByCategoryIds(idArray, limit, offset) {
  return db('courses as c')
    .where('c.is_disabled', false)
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')

    // SỬA LẠI JOIN: Bỏ bảng 'instructors'
    .leftJoin('users as u', 'c.instructor_id', 'u.id')

    .select(
      'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
      'c.rating_avg', 'c.rating_count',
      'cat.catname as category',
      'u.name as instructor_name' // Giữ nguyên
    )
    .whereIn('c.category_id', idArray)
    .orderBy('c.id', 'desc')
    .limit(limit)
    .offset(offset);
}

export async function countByCategoryIds(idArray) {
  const result = await db('courses')
    .where('is_disabled', false)
    .whereIn('category_id', idArray)
    .count('* as total')
    .first();
  return result.total;
}

/**
 * MỚI: Tìm tất cả khóa học dựa trên một MẢNG category_id
 */
export function findByCategoryIds(idArray) {
  return db('courses as c')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id') // Dùng leftJoin cho an toàn
    .select(
      'c.id',
      'c.title',
      'c.thumbnail',
      'c.price',
      'c.sale_price',
      'c.rating_avg',
      'c.rating_count',
      'cat.catname as category'
    )
    .whereIn('c.category_id', idArray); // Dùng "whereIn" thay vì "where"
}

export async function findOutstandingPastWeek() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return db('courses as c')
    .where('c.is_disabled', false)
    .join('enrollments as e', 'c.id', 'e.course_id')
    .join('categories as cat', 'c.category_id', 'cat.id')

    // SỬA LẠI JOIN: Bỏ bảng 'instructors'
    .leftJoin('users as u', 'c.instructor_id', 'u.id')

    .select(
      'c.id', 'c.title', 'c.description', 'c.thumbnail',
      'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count',
      'cat.catname as category',
      'u.name as instructor_name',
      db.raw('COUNT(e.course_id) as enrollment_count')
    )
    .groupBy('c.id', 'c.title', 'c.description', 'c.thumbnail', 'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count', 'cat.catname', 'u.name')
    .orderBy('enrollment_count', 'desc')
    .limit(4);
}

export async function findPageByFTS(queryText, sortOption = 'default', limit, offset) {

  const safeQuery = sanitizeFTS(queryText);

  const query = db('courses as c')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .select(
      'c.id',
      'c.title',
      'c.thumbnail',
      'c.price',
      'c.sale_price',
      'cat.catname as category',
      'c.rating_avg',
      'c.rating_count',
      db.raw(
        "ts_rank(to_tsvector('simple', c.title || ' ' || cat.catname), plainto_tsquery('simple', ?)) AS rank",
        [safeQuery]
      )
    )
    .whereRaw(
      "to_tsvector('simple', c.title || ' ' || cat.catname) @@ plainto_tsquery('simple', ?)",
      [safeQuery]
    )
    .andWhere('c.is_disabled', false);

  switch (sortOption) {
    case 'price_asc':
      query.orderBy('c.price', 'asc');
      break;
    case 'rating_desc':
      query.orderBy('c.rating_avg', 'desc');
      break;
    default:
      query.orderBy('rank', 'desc');
      break;
  }

  query.limit(limit).offset(offset);
  return query;
}


/**
 Đếm tổng số kết quả FTS
 */
export async function countByFTS(queryText) {
  const safeQuery = sanitizeFTS(queryText);

  const result = await db('courses as c')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .whereRaw(
      "to_tsvector('simple', c.title || ' ' || cat.catname) @@ plainto_tsquery('simple', ?)",
      [safeQuery]
    )
    .andWhere('c.is_disabled', false)
    .count('* as total')
    .first();

  return result.total;
}


export async function findNewest(limit = 10) {
  return db('courses as c')
    .where('c.is_disabled', false)
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')

    // SỬA LẠI JOIN: Bỏ bảng 'instructors'
    .leftJoin('users as u', 'c.instructor_id', 'u.id')

    .select(
      'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
      'c.rating_avg', 'c.rating_count',
      'cat.catname as category',
      'u.name as instructor_name'
    )
    .orderBy('c.id', 'desc')
    .limit(limit);
}

export async function findMostViewed(limit = 10) {
  return db('courses as c')
    .where('c.is_disabled', false)
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')

    // SỬA LẠI JOIN: Bỏ bảng 'instructors'
    .leftJoin('users as u', 'c.instructor_id', 'u.id')

    .select(
      'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
      'c.rating_avg', 'c.rating_count',
      'cat.catname as category',
      'u.name as instructor_name'
    )
    .orderBy('c.view_count', 'desc')
    .limit(limit);
}
// hàm đếm view khóa học
export async function incrementViewCount(courseId) {
  return db('courses')
    .where('id', courseId)
    .increment('view_count', 1);
}

//////// khu vực admin
export async function countByCategory(categoryId) {
  const result = await db('courses')
    .where('category_id', categoryId)
    .count('id as count')
    .first();
  return Number(result?.count || 0);
}

export function getAllWithCategoryAndTeacher(categoryId = null) {
  const query = db({ c: 'courses' })
    .leftJoin({ cat: 'categories' }, 'cat.id', 'c.category_id')
    .leftJoin({ u: 'users' }, 'u.id', 'c.instructor_id')
    .select(
      'c.id',
      db.ref('c.title').as('course_title'),
      db.ref('cat.catname').as('category_name'),
      db.ref('u.name').as('instructor_name'),
      db.ref('c.is_disabled').as('is_disabled')
    )
    .orderBy('c.id', 'asc');

  if (categoryId) {
    query.andWhere('c.category_id', categoryId);
  }

  return query;
}

export async function toggleDisable(id, disable) {
  return db('courses').where({ id }).update({ is_disabled: disable });
}

export function deleteById(id) {
  return db('courses').where({ id }).del();
}