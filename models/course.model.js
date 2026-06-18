/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Course — Class Diagram                            ║
 * ║                                                              ║
 * ║  Tương đương @Entity @Table("courses") trong Spring Boot     ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - id: int              (PK, auto-increment)               ║
 * ║    - instructor_id: int   (FK → users.id)                    ║
 * ║    - category_id: int     (FK → categories.id)               ║
 * ║    - title: string        (not null)                          ║
 * ║    - short_desc: string                                      ║
 * ║    - full_desc: string                                       ║
 * ║    - price: decimal                                          ║
 * ║    - thumbnail: string                                       ║
 * ║    - is_disabled: bool    (default: false)                   ║
 * ║    - lectures: List<Lecture>  (@OneToMany)                   ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Course ◆──── 0..* Lecture (composition)                   ║
 * ║    Course ────→ Category   (@ManyToOne)                      ║
 * ║    Course ────→ User/Instructor (@ManyToOne)                 ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [03] View Course Details, [04] Search Course,             ║
 * ║    [07] View by Category, [08] Filter, [13] Create,         ║
 * ║    [15] Manage, [16] Toggle Status, [18] Edit,              ║
 * ║    [19] Manage Courses (Admin)                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import db from '../utils/db.js';

function sanitizeFTS(input) {
  return (input || '')
    .replace(/[&|!():]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Entity class Course — tương đương @Entity trong Spring Boot.
 * Bảng DB: "courses"
 */
class Course {

  // ─── @Column definitions ───

  /** @Column(name = "id", primaryKey = true, autoIncrement = true) */
  id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "instructor_id", referencedColumnName = "id")
   * Quan hệ: Course → User (Instructor)
   */
  instructor_id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "category_id", referencedColumnName = "id")
   * Quan hệ: Course → Category
   */
  category_id;

  /** @Column(name = "title", nullable = false) */
  title;

  /** @Column(name = "short_desc", nullable = true) */
  short_desc;

  /** @Column(name = "full_desc", nullable = true, columnDefinition = "TEXT") */
  full_desc;

  /** @Column(name = "price", nullable = true, precision = 10, scale = 2) */
  price;

  /** @Column(name = "thumbnail", nullable = true) */
  thumbnail;

  /** @Column(name = "is_disabled", nullable = false, default = false) */
  is_disabled;

  /**
   * @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = LAZY)
   * Quan hệ composition: Course ◆──── 0..* Lecture
   * Xóa Course → xóa tất cả Lecture con.
   */
  lectures;

  // ─── Constructor ───

  constructor(data = {}) {
    this.id = data.id || null;
    this.instructor_id = data.instructor_id || null;
    this.category_id = data.category_id || null;
    this.title = data.title || null;
    this.short_desc = data.short_desc || null;
    this.full_desc = data.full_desc || null;
    this.price = data.price || 0;
    this.thumbnail = data.thumbnail || null;
    this.is_disabled = data.is_disabled || false;
    this.lectures = data.lectures || [];
  }

  validate() {
    if (!this.title || this.title.trim() === '') {
      throw new Error('Title must not be blank');
    }
    return true;
  }

  // ═══════════════════════════════════════════
  // Static Methods — Tương đương @Repository
  // (JpaRepository<Course, Integer>)
  // ═══════════════════════════════════════════

  // ─── Course.findPageAll(lim, off) ───
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

  static async countAll() {
    const result = await db('courses')
      .where('is_disabled', false)
      .count('* as total')
      .first();
    return result.total;
  }

  // ─── Course.findById(id) ── UC [03] View Course Details ───
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

  // ─── UC [07] View Courses by Category ───
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

  // ─── Course.findOutstandingPastWeek() ───
  static async findOutstandingPastWeek() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return db('courses as c')
      .where('c.is_disabled', false)
      .join('enrollments as e', 'c.id', 'e.course_id')
      .join('categories as cat', 'c.category_id', 'cat.id')
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

  // ─── Course.findPageByFTS(q, sort, lim, off) ── UC [04] Search ───
  static async findPageByFTS(queryText, sortOption = 'default', limit, offset) {
    const safeQuery = sanitizeFTS(queryText);

    const query = db('courses as c')
      .leftJoin('categories as cat', 'c.category_id', 'cat.id')
      .select(
        'c.id', 'c.title', 'c.thumbnail', 'c.price', 'c.sale_price',
        'cat.catname as category',
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

  static async countByFTS(queryText) {
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

  // ─── Course.findNewest(limit) ───
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

  // ─── Course.findMostViewed(limit) ───
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

  // ─── Course.CountRating() ── UC [11] ───
  static async countRating(courseId) {
    const result = await db('feedback')
      .where('course_id', courseId)
      .count('* as total')
      .first();
    return Number(result?.total || 0);
  }

  // ─── Course.CountView() ── UC [03] ───
  static async countView(courseId) {
    const result = await db('courses')
      .where('id', courseId)
      .select('view_count')
      .first();
    return Number(result?.view_count || 0);
  }

  // ─── Course.AvgRate() ── UC [11] ───
  static async avgRate(courseId) {
    const result = await db('feedback')
      .where('course_id', courseId)
      .avg('rating as avg_rating')
      .first();
    return Number(result?.avg_rating || 0);
  }

  // ─── Course.toggleDisable(id, state) ── UC [16], [19] ───
  static async toggleDisable(id, disable) {
    return db('courses').where({ id }).update({ is_disabled: disable });
  }

  // ─── Course.deleteById(id) ── UC [19] ───
  static deleteById(id) {
    return db('courses').where({ id }).del();
  }

  // ─── Admin helpers ───
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
}

export default Course;