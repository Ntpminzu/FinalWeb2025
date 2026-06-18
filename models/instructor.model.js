/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Instructor — Class Diagram (permission=2)         ║
 * ║  Kế thừa: User                                              ║
 * ║                                                              ║
 * ║  Tương đương @Entity @Table("instructors") trong Spring Boot ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - user_id: int         (FK → users.id, unique)            ║
 * ║    - bio: string                                             ║
 * ║    - specialization: string                                  ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Instructor ────→ User  (@OneToOne)                        ║
 * ║    Instructor ←──── Course (@OneToMany)                      ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [13] Create Course, [14] Manage Lecture,                  ║
 * ║    [15] Manage Course, [16] Toggle Status,                   ║
 * ║    [18] Edit Course, [21] Manage Profile                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import db from '../utils/db.js';

/**
 * Entity class Instructor — tương đương @Entity trong Spring Boot.
 * Bảng DB: "instructors" (bảng mở rộng của users)
 */
class Instructor {

  // ─── @Column definitions ───

  /**
   * @OneToOne(fetch = LAZY, optional = false)
   * @JoinColumn(name = "user_id", nullable = false, unique = true)
   * Quan hệ: Instructor → User
   */
  user_id;

  /** @Column(name = "bio", nullable = true, columnDefinition = "TEXT") */
  bio;

  /** @Column(name = "specialization", nullable = true) */
  specialization;

  // ─── Constructor ───

  constructor(data = {}) {
    this.user_id = data.user_id || null;
    this.bio = data.bio || null;
    this.specialization = data.specialization || null;
    // Joined fields from User
    this.name = data.name || null;
    this.email = data.email || null;
    this.username = data.username || null;
    this.total_students = data.total_students || 0;
    this.total_courses = data.total_courses || 0;
    this.rating_avg = data.rating_avg || 0;
  }

  // ═══════════════════════════════════════════
  // Static Methods — Tương đương @Repository
  // ═══════════════════════════════════════════

  /**
   * Tìm instructor theo user ID (join users + instructors).
   * Tương đương: instructorRepository.findByUserId(userId)
   */
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
      console.error('❌ Lỗi trong Instructor.findById():', err);
      throw err;
    }
  }

  // ─── Instructor.updateProfile(bio, spec) ── UC [21] ───
  static update(userId, data) {
    return db('instructors').where('user_id', userId).update(data);
  }

  // ─── Instructor.CountStudent() ───
  static async countStudent(instructorId) {
    const result = await db('courses as c')
      .join('enrollments as e', 'c.id', 'e.course_id')
      .where('c.instructor_id', instructorId)
      .countDistinct('e.student_id as total')
      .first();
    return Number(result?.total || 0);
  }

  // ─── Instructor.CountCourse() ───
  static async countCourse(instructorId) {
    const result = await db('courses')
      .where('instructor_id', instructorId)
      .count('* as total')
      .first();
    return Number(result?.total || 0);
  }

  // ─── Instructor.AvgRating() ───
  static async avgRating(instructorId) {
    const result = await db('courses')
      .where('instructor_id', instructorId)
      .whereNotNull('rating_avg')
      .avg('rating_avg as avg')
      .first();
    return Number(result?.avg || 0);
  }

  // ─── Instructor.viewDashboard() ───
  static findCoursesByInstructor(instructorId) {
    return db('courses').where('instructor_id', instructorId);
  }

  // ─── Instructor.editCourse(id, data) ── UC [18] ───
  static async updateCourse(courseId, data) {
    try {
      const updateData = {
        title: data.title,
        short_desc: data.short_desc,
        full_desc: data.full_desc,
        description: data.description || data.full_desc,
        price: data.price,
        sale_price: data.sale_price || null,
        updated_at: new Date(),
      };
      if (data.thumbnail) updateData.thumbnail = data.thumbnail;
      await db('courses').where('id', courseId).update(updateData);
      return true;
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

  // ─── Instructor.createCourse(data) ── UC [13] ───
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
    const courses = await db('courses')
      .where('instructor_id', instructorId)
      .select('*');

    for (let course of courses) {
      const studentCount = await db('enrollments')
        .where('course_id', course.id)
        .count('id as total_students')
        .first();
      course.status = course.Status ? 'Đã hoàn thành' : 'Chưa hoàn thành';
      course.total_students = studentCount?.total_students || 0;
    }
    return courses;
  }

  static async getCourseById(id) {
    try {
      return await db('courses').where('id', id).first();
    } catch (err) {
      throw new Error('Lỗi khi lấy thông tin khóa học: ' + err.message);
    }
  }

  // ─── Instructor.addLecture(cId, title, url) ── UC [14] ───
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

  static async addLecture(course_id, title, video_url) {
    try {
      const [lecture] = await db('lectures')
        .insert({ course_id, title, video_url })
        .returning(['id', 'title', 'video_url']);
      return lecture;
    } catch (err) {
      throw new Error('Lỗi khi thêm bài giảng: ' + err.message);
    }
  }

  // ─── Instructor.deleteLecture(id) ── UC [14] ───
  static async deleteLecture(id) {
    try {
      await db('lectures').where('id', id).del();
    } catch (err) {
      throw new Error('Lỗi khi xóa bài giảng: ' + err.message);
    }
  }
}

export default Instructor;