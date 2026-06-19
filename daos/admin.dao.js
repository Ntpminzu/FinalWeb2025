import db from '../utils/db.js';

class AdminDao {
  static async getDashboardStats() {
    const [totalCourses] = await db('courses').count('id as total');
    const totalStudents = await db('users').where('permission', '=', 1).count('id as total').first();
    const [totalInstructors] = await db('users').where('permission', 2).count('id as total');
    const [totalCategories] = await db('categories').count('id as total');

    return {
      totalCourses: Number(totalCourses?.total || 0),
      totalStudents: Number(totalStudents?.total || 0),
      totalInstructors: Number(totalInstructors?.total || 0),
      totalCategories: Number(totalCategories?.total || 0),
    };
  }

  static async getTopCategories(limit = 5) {
    return db('categories as cat')
      .leftJoin('courses as c', 'c.category_id', 'cat.id')
      .select('cat.catname as name')
      .count('c.id as count')
      .groupBy('cat.id', 'cat.catname')
      .orderBy('count', 'desc')
      .limit(limit);
  }

  static async getCourseStatuses() {
    const [published] = await db('courses').where('is_disabled', false).count('id as count');
    const [disabled] = await db('courses').where('is_disabled', true).count('id as count');

    return {
      Published: Number(published?.count || 0),
      Disabled: Number(disabled?.count || 0),
    };
  }
}

export default AdminDao;
