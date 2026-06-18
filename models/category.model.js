/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Category — Class Diagram                          ║
 * ║                                                              ║
 * ║  Tương đương @Entity @Table("categories") trong Spring Boot  ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - id: int              (PK, auto-increment)               ║
 * ║    - parent_id: int       (FK → categories.id, self-ref)     ║
 * ║    - catname: string      (not null)                          ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Category ────→ Category (self-referencing: parent)         ║
 * ║    @ManyToOne  parent                                        ║
 * ║    @OneToMany  children                                      ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [07] View Courses by Category,                            ║
 * ║    [20] Manage Categories (Admin)                            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import db from '../utils/db.js';

/**
 * Entity class Category — tương đương @Entity trong Spring Boot.
 * Bảng DB: "categories"
 */
class Category {

  // ─── @Column definitions ───

  /** @Column(name = "id", primaryKey = true, autoIncrement = true) */
  id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "parent_id", nullable = true)
   * Quan hệ self-referencing: Category → Category (parent)
   */
  parent_id;

  /** @Column(name = "catname", nullable = false) */
  catname;

  /**
   * @OneToMany(mappedBy = "parent", fetch = LAZY)
   * Danh mục con (inverse side of parent_id)
   */
  children;

  // ─── Constructor ───

  constructor(data = {}) {
    this.id = data.id || null;
    this.parent_id = data.parent_id || null;
    this.catname = data.catname || null;
    this.children = data.children || [];
  }

  validate() {
    if (!this.catname || this.catname.trim() === '') {
      throw new Error('Category name must not be blank');
    }
    return true;
  }

  // ═══════════════════════════════════════════
  // Static Methods — Tương đương @Repository
  // ═══════════════════════════════════════════

  // ─── Category.all() ── UC [07], [20] ───
  static async all() {
    const allCategories = await db('categories');

    const categories = [];
    const map = {};

    allCategories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });

    allCategories.forEach(cat => {
      if (cat.parent_id !== null && cat.parent_id !== undefined) {
        if (map[cat.parent_id]) {
          map[cat.parent_id].children.push(map[cat.id]);
        }
      } else {
        categories.push(map[cat.id]);
      }
    });

    return categories;
  }

  // ─── Category.findById(id) ───
  static async findById(id) {
    const row = await db('categories').where('id', id).first();
    return row ? new Category(row) : null;
  }

  // ─── Category.add(name) ── UC [20] ───
  static async add(category) {
    return await db('categories').insert({ catname: category.name });
  }

  // ─── Category.patch(id, name) ── UC [20] ───
  static async patch(id, category) {
    return await db('categories').where('id', id).update({ catname: category.name });
  }

  // ─── Category.remove(id) ── UC [20] ───
  static async remove(id) {
    return await db('categories').where('id', id).del();
  }

  // ─── Category.findChildIds(parentId) ───
  static async findChildIds(parentId) {
    const children = await db('categories')
      .where('parent_id', parentId)
      .select('id');
    return children.map(child => child.id);
  }

  static async findMostEnrolledPastWeek(limit = 5) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return db('categories as cat')
      .join('courses as c', 'c.category_id', 'cat.id')
      .join('enrollments as e', 'e.course_id', 'c.id')
      .where('e.enrolled_at', '>=', sevenDaysAgo)
      .select(
        'cat.id',
        'cat.catname',
        db.raw('COUNT(e.id) as enroll_count')
      )
      .groupBy('cat.id', 'cat.catname')
      .orderBy('enroll_count', 'desc')
      .limit(limit);
  }

  static async getAllWithCourseCount() {
    return db('categories as c')
      .leftJoin('courses as cs', 'cs.category_id', 'c.id')
      .select('c.id', 'c.catname as name')
      .count('cs.id as courseCount')
      .groupBy('c.id', 'c.catname')
      .orderBy('c.id', 'asc')
      .then(rows =>
        rows.map(r => ({
          ...r,
          courseCount: Number(r.courseCount)
        }))
      );
  }
}

export default Category;
