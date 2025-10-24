import db from '../utils/db.js';


export function findAll() {
  return db('courses')
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
      'sale_price',   // <-- THÊM DÒNG NÀY
      'rating_avg',   // <-- THÊM DÒNG NÀY
      'rating_count'
    )
    .where('category_id', categoryId);
}


export async function findOutstandingPastWeek() {

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return db('courses as c')
    .join('enrollments as e', 'c.id', 'e.course_id')
    // +++ THÊM JOIN BẢNG CATEGORIES +++
    .join('categories as cat', 'c.category_id', 'cat.id') // Giả sử khóa ngoại là category_id
    .where('e.enrolled_at', '>=', sevenDaysAgo)
    .select(
      'c.id',
      'c.title',
      'c.description',
      'c.thumbnail',
      'c.price', // +++ THÊM GIÁ +++
      'c.sale_price',   // <-- THÊM DÒNG NÀY
      'c.rating_avg',   // <-- THÊM DÒNG NÀY
      'c.rating_count',
      'cat.catname as category', // +++ THÊM TÊN CATEGORY +++
      db.raw('COUNT(e.course_id) as enrollment_count')
    )
    // +++ CẬP NHẬT GROUP BY +++
    .groupBy('c.id', 'c.title', 'c.description', 'c.thumbnail', 'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count', 'cat.catname')
    .orderBy('enrollment_count', 'desc')
    .limit(4);
}

export async function searchByFTS(queryText, sortOption = 'default') {

  const ftsQuery = queryText.trim().split(' ').filter(Boolean).join(' & ');

  // 1. Xây dựng câu truy vấn cơ bản
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
    // Câu WHERE FTS vẫn như cũ
    .whereRaw("to_tsvector('simple', c.title || ' ' || cat.catname) @@ to_tsquery('simple', ?)", [ftsQuery]);

  // 2. Thêm logic sắp xếp
  switch (sortOption) {
    case 'price_asc':
      query.orderBy('c.price', 'asc');
      break;
    case 'rating_desc':
      query.orderBy('c.rating_avg', 'desc'); // <-- (Nhớ sửa tên cột nếu cần)
      break;
    default:
      // Sắp xếp theo độ liên quan FTS (rank) giảm dần
      query.orderBy('rank', 'desc');
      break;
  }

  // 3. Trả về kết quả
  return query;
}