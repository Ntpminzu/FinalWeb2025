import db from '../utils/db.js';
import Instructor from '../models/instructor.model.js';

class InstructorDao {
  static async findById(userId) {
    try {
      const row = await db('instructors as i')
        .join('users as u', 'i.user_id', 'u.id')
        .select(
          'u.id as user_id',
          'u.name',
          'u.email',
          'u.username',
          'u.role',
          'i.bio',
          'i.specialization',
          'i.total_students',
          'i.total_courses',
          'i.rating_avg'
        )
        .where('u.id', userId)
        .first();

      return row ? new Instructor(row) : null;
    } catch (err) {
      console.error('❌ Lỗi trong InstructorDao.findById():', err);
      throw err;
    }
  }

  static update(userId, data) {
    return db('instructors').where('user_id', userId).update(data);
  }

  static async countStudent(instructorId) {
    const result = await db('courses as c')
      .join('enrollments as e', 'c.id', 'e.course_id')
      .where('c.instructor_id', instructorId)
      .countDistinct('e.student_id as total')
      .first();
    return Number(result?.total || 0);
  }

  static async countCourse(instructorId) {
    const result = await db('courses')
      .where('instructor_id', instructorId)
      .count('* as total')
      .first();
    return Number(result?.total || 0);
  }

  static async avgRating(instructorId) {
    const result = await db('courses')
      .where('instructor_id', instructorId)
      .whereNotNull('rating_avg')
      .avg('rating_avg as avg')
      .first();
    return Number(result?.avg || 0);
  }

  static findCoursesByInstructor(instructorId) {
    return db('courses').where('instructor_id', instructorId);
  }

  static async updateCourse(courseId, instructorId, data) {
    try {
      const updateData = {
        title: data.title,
        short_desc: data.short_desc,
        full_desc: data.full_desc,
        description: data.description || data.full_desc,
        category_id: data.category_id,
        price: data.price,
        sale_price: data.sale_price || null,
        updated_at: new Date(),
      };
      if (data.thumbnail) updateData.thumbnail = data.thumbnail;
      const updated = await db('courses')
        .where({ id: courseId, instructor_id: instructorId })
        .update(updateData);
      return updated > 0;
    } catch (err) {
      console.error('❌ Lỗi khi updateCourse:', err);
      throw new Error('Không thể cập nhật khóa học.');
    }
  }

  static async getAllCategories() {
    try {
      return await db('categories').select('id', 'catname as name');
    } catch (err) {
      throw new Error('Lỗi khi lấy danh sách lĩnh vực: ' + err.message);
    }
  }

  static async addCourse(courseData) {
    try {
      const [newCourse] = await db('courses')
        .insert({
          instructor_id: courseData.instructor_id,
          title: courseData.title,
          category_id: courseData.category_id,
          short_desc: courseData.short_desc ?? null,
          full_desc: courseData.full_desc ?? null,
          description: courseData.description ?? courseData.full_desc ?? null,
          price: courseData.price ?? 0,
          sale_price: courseData.sale_price ?? null,
          thumbnail: courseData.thumbnail ?? null,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');
      return newCourse;
    } catch (err) {
      console.error('❌ Lỗi khi thêm khóa học:', err);
      throw new Error('Không thể thêm khóa học.');
    }
  }

  static async getCoursesByInstructor(instructorId) {
    const courses = await db('courses as c')
      .leftJoin('enrollments as e', 'e.course_id', 'c.id')
      .where('c.instructor_id', instructorId)
      .select('c.*')
      .count('e.id as total_students')
      .groupBy('c.id')
      .orderBy('c.id', 'desc');

    for (const course of courses) {
      course.status = course.Status ? 'Đã hoàn thành' : 'Chưa hoàn thành';
      course.total_students = Number(course.total_students || 0);
    }
    return courses;
  }

  static async getCourseById(id, instructorId = null) {
    try {
      const query = db('courses').where('id', id);
      if (instructorId !== null) query.andWhere('instructor_id', instructorId);
      return await query.first();
    } catch (err) {
      throw new Error('Lỗi khi lấy thông tin khóa học: ' + err.message);
    }
  }

  static async getLecturesByCourse(course_id) {
    try {
      return await db('lectures')
        .where('course_id', course_id)
        .orderBy('id', 'asc')
        .select('id', 'title', 'video_url');
    } catch (err) {
      throw new Error('Lỗi khi lấy danh sách bài giảng: ' + err.message);
    }
  }

  static async addLecture(course_id, instructorId, title, video_url) {
    try {
      const owned = await db('courses').where({ id: course_id, instructor_id: instructorId }).first('id');
      if (!owned) return null;
      const [lecture] = await db('lectures')
        .insert({ course_id, title, video_url })
        .returning(['id', 'title', 'video_url']);
      return lecture;
    } catch (err) {
      throw new Error('Lỗi khi thêm bài giảng: ' + err.message);
    }
  }

  static async deleteLecture(id, instructorId) {
    try {
      const lecture = await db('lectures as l')
        .join('courses as c', 'c.id', 'l.course_id')
        .where('l.id', id)
        .andWhere('c.instructor_id', instructorId)
        .select('l.id')
        .first();
      if (!lecture) return false;
      await db('lectures').where('id', id).del();
      return true;
    } catch (err) {
      throw new Error('Lỗi khi xóa bài giảng: ' + err.message);
    }
  }

  static getCategoryById(id) {
    return db('categories').where('id', id).first('id');
  }

  static async countLectures(courseId, instructorId) {
    const row = await db('lectures as l')
      .join('courses as c', 'c.id', 'l.course_id')
      .where('l.course_id', courseId)
      .andWhere('c.instructor_id', instructorId)
      .count('l.id as total')
      .first();
    return Number(row?.total || 0);
  }
}

export default InstructorDao;
