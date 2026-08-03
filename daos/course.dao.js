import db from '../utils/db.js';
import Course from '../models/course.model.js';

function sanitizeFTS(input) {
  return (input || '')
    .replace(/[&|!():]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

class CourseDao {
  static findPageAll(limit, offset) {
    return db('courses as c')
      .where('c.is_disabled', false)
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
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

  static applyApiSort(query, sort) {
    switch (sort) {
      case 'popular':
        return query.orderBy('c.view_count', 'desc').orderBy('c.id', 'desc');
      case 'rating_desc':
        return query.orderBy('c.rating_avg', 'desc').orderBy('c.rating_count', 'desc').orderBy('c.id', 'desc');
      case 'price_asc':
        return query.orderByRaw('COALESCE(c.sale_price, c.price) asc').orderBy('c.id', 'desc');
      case 'price_desc':
        return query.orderByRaw('COALESCE(c.sale_price, c.price) desc').orderBy('c.id', 'desc');
      case 'newest':
      default:
        return query.orderBy('c.id', 'desc');
    }
  }

  static findPageAllForApi(filters) {
    const query = db('courses as c')
      .where('c.is_disabled', false)
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .leftJoin('users as u', 'c.instructor_id', 'u.id')
      .select(
        'c.id', 'c.title', 'c.thumbnail', 'c.short_desc', 'c.description',
        'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count',
        'c.view_count',
        'cat.catname as category',
        'u.name as instructor_name'
      );
    if (filters.categoryId) query.andWhere('c.category_id', filters.categoryId);
    CourseDao.applyApiSort(query, filters.sort);
    return query.limit(filters.limit).offset(filters.offset);
  }

  static async countAllForApi(filters) {
    const query = db('courses as c')
      .where('c.is_disabled', false)
      .count('* as total');
    if (filters.categoryId) query.andWhere('c.category_id', filters.categoryId);
    const result = await query.first();
    return result.total;
  }

  static async countAll() {
    const result = await db('courses')
      .where('is_disabled', false)
      .count('* as total')
      .first();
    return result.total;
  }

  static findById(id) {
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

  static findPageByCategoryIds(idArray, limit, offset) {
    return db('courses as c')
      .where('c.is_disabled', false)
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .leftJoin('users as u', 'c.instructor_id', 'u.id')
      .select(
        'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
        'c.rating_avg', 'c.rating_count',
        'cat.catname as category',
        'u.name as instructor_name'
      )
      .whereIn('c.category_id', idArray)
      .orderBy('c.id', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async countByCategoryIds(idArray) {
    const result = await db('courses')
      .where('is_disabled', false)
      .whereIn('category_id', idArray)
      .count('* as total')
      .first();
    return result.total;
  }

  static findByCategoryIds(idArray) {
    return db('courses as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .select(
        'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
        'c.rating_avg', 'c.rating_count',
        'cat.catname as category'
      )
      .whereIn('c.category_id', idArray);
  }

  static async findOutstandingPastWeek() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return db('courses as c')
      .where('c.is_disabled', false)
      .join('purchased as p', 'c.id', 'p.course_id')
      .join('categories as cat', 'c.category_id', 'cat.id')
      .leftJoin('users as u', 'c.instructor_id', 'u.id')
      .where('p.purchased_at', '>=', sevenDaysAgo)
      .select(
        'c.id', 'c.title', 'c.description', 'c.thumbnail',
        'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count',
        'cat.catname as category',
        'u.name as instructor_name',
        db.raw('COUNT(p.course_id) as enrollment_count')
      )
      .groupBy('c.id', 'c.title', 'c.description', 'c.thumbnail', 'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count', 'cat.catname', 'u.name')
      .orderBy('enrollment_count', 'desc')
      .limit(4);
  }

  static async findPageByFTS(queryText, sortOption = 'default', limit, offset, categoryId = null) {
    const safeQuery = sanitizeFTS(queryText);

    const query = db('courses as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .leftJoin('users as u', 'c.instructor_id', 'u.id')
      .select(
        'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
        'c.short_desc', 'c.description',
        'cat.catname as category',
        'u.name as instructor_name',
        'c.rating_avg', 'c.rating_count',
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
    if (categoryId) query.andWhere('c.category_id', categoryId);

    switch (sortOption) {
      case 'price_asc':
        query.orderBy('c.price', 'asc');
        break;
      case 'price_desc':
        query.orderBy('c.price', 'desc');
        break;
      case 'rating_desc':
        query.orderBy('c.rating_avg', 'desc');
        break;
      case 'newest':
        query.orderBy('c.id', 'desc');
        break;
      case 'popular':
        query.orderBy('c.view_count', 'desc');
        break;
      default:
        query.orderBy('rank', 'desc');
        break;
    }

    query.limit(limit).offset(offset);
    return query;
  }

  static async countByFTS(queryText, categoryId = null) {
    const safeQuery = sanitizeFTS(queryText);

    const query = db('courses as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .whereRaw(
        "to_tsvector('simple', c.title || ' ' || cat.catname) @@ plainto_tsquery('simple', ?)",
        [safeQuery]
      )
      .andWhere('c.is_disabled', false);
    if (categoryId) query.andWhere('c.category_id', categoryId);

    const row = await query.count('* as total').first();

    return row.total;
  }

  static async findNewest(limit = 10) {
    return db('courses as c')
      .where('c.is_disabled', false)
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
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

  static async findMostViewed(limit = 10) {
    return db('courses as c')
      .where('c.is_disabled', false)
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
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

  static async incrementViewCount(courseId) {
    return db('courses')
      .where('id', courseId)
      .increment('view_count', 1);
  }

  static async countRating(courseId) {
    const result = await db('feedback')
      .where('course_id', courseId)
      .count('* as total')
      .first();
    return Number(result?.total || 0);
  }

  static async countView(courseId) {
    const result = await db('courses')
      .where('id', courseId)
      .select('view_count')
      .first();
    return Number(result?.view_count || 0);
  }

  static async avgRate(courseId) {
    const result = await db('feedback')
      .where('course_id', courseId)
      .avg('rating as avg_rating')
      .first();
    return Number(result?.avg_rating || 0);
  }

  static async toggleDisable(id, disable) {
    return db('courses').where({ id }).update({ is_disabled: disable });
  }

  static deleteById(id) {
    return db('courses').where({ id }).del();
  }

  static async countByCategory(categoryId) {
    const result = await db('courses')
      .where('category_id', categoryId)
      .count('id as count')
      .first();
    return Number(result?.count || 0);
  }

  static getAllWithCategoryAndTeacher(categoryId = null) {
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

  static toggleStatus(id, status, instructorId = null) {
    const query = db('courses').where({ id });
    if (instructorId !== null) query.andWhere('instructor_id', instructorId);
    return query.update({
      Status: status,
      updated_at: new Date(),
    });
  }
}

export default CourseDao;

