import db from '../utils/db.js';
import Category from '../models/category.model.js';

class CategoryDao {
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

  static async findById(id) {
    const row = await db('categories').where('id', id).first();
    return row ? new Category(row) : null;
  }

  static async add(category) {
    return await db('categories').insert({ catname: category.name });
  }

  static async patch(id, category) {
    return await db('categories').where('id', id).update({ catname: category.name });
  }

  static async remove(id) {
    return await db('categories').where('id', id).del();
  }

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
      .join('purchased as p', 'p.course_id', 'c.id')
      .where('p.purchased_at', '>=', sevenDaysAgo)
      .select(
        'cat.id',
        'cat.catname',
        db.raw('COUNT(p.id) as enroll_count')
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

export default CategoryDao;
