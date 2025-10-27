import db from '../utils/db.js';


export function findAll() {
  return db('courses as c')
    .join('categories as cat', 'c.category_id', 'cat.id')
    .select(
      'c.id',
      'c.title',
      'c.thumbnail',
      'c.short_desc',
      'c.description',
      'c.price',
      'c.sale_price',
      'c.rating_avg',
      'c.rating_count',
      'cat.catname as category'
    );
}


export function findById(id) {
  return db('courses')
    .where('id', id)
    .first();
}

export function findByCategoryId(categoryId) {
  return db('courses')
    .select(
      'id',
      'title',
      'thumbnail',
      'price',
      'sale_price',
      'rating_avg',
      'rating_count'
    )
    .where('category_id', categoryId);
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
    .join('enrollments as e', 'c.id', 'e.course_id')
    .join('categories as cat', 'c.category_id', 'cat.id')
    .where('e.enrolled_at', '>=', sevenDaysAgo)
    .select(
      'c.id',
      'c.title',
      'c.description',
      'c.thumbnail',
      'c.price',
      'c.sale_price',
      'c.rating_avg',
      'c.rating_count',
      'cat.catname as category',
      db.raw('COUNT(e.course_id) as enrollment_count')
    )

    .groupBy('c.id', 'c.title', 'c.description', 'c.thumbnail', 'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count', 'cat.catname')
    .orderBy('enrollment_count', 'desc')
    .limit(4);
}

export async function searchByFTS(queryText, sortOption = 'default') {

  const ftsQuery = queryText.trim().split(' ').filter(Boolean).join(' & ');


  const query = db('courses as c')
    .join('categories as cat', 'c.category_id', 'cat.id')
    .select(
      'c.id',
      'c.title',
      'c.thumbnail',
      'c.price',
      'c.sale_price',
      'cat.catname as category',
      'c.rating_avg',
      'c.rating_count',
      db.raw("ts_rank(to_tsvector('simple', c.title || ' ' || cat.catname), to_tsquery('simple', ?)) AS rank", [ftsQuery])
    )
    .whereRaw("to_tsvector('simple', c.title || ' ' || cat.catname) @@ to_tsquery('simple', ?)", [ftsQuery]);


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
  return query;
}

export async function findNewest(limit = 10) {
  return db('courses as c')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .select(
      'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
      'c.rating_avg', 'c.rating_count', 'cat.catname as category'
    )
    .orderBy('c.id', 'desc')
    .limit(limit);
}

export async function findMostViewed(limit = 10) {
  return db('courses as c')
    .leftJoin('categories as cat', 'c.category_id', 'cat.id')
    .select(
      'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
      'c.rating_avg', 'c.rating_count', 'cat.catname as category'
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

export function getAllWithCategoryAndTeacher() {
  return db({ c: 'courses' })
    // categories: dùng category_id
    .leftJoin({ cat: 'categories' }, 'cat.id', 'c.category_id')
    // users: dùng instructor_id
    .leftJoin({ u: 'users' }, 'u.id', 'c.instructor_id')
    .select(
      'c.id',
      db.ref('c.title').as('course_title'),
      // 🔧 đổi name -> title cho bảng categories
      db.ref('cat.catname').as('category_name'),
      // 🔧 đổi name -> fullname cho bảng users (nếu bảng bạn dùng fullname)
      db.ref('u.name').as('instructor_name')
    );
}

export function deleteById(id) {
  return db('courses').where({ id }).del();
}