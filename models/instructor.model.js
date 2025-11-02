import db from '../utils/db.js';

export async function findById(userId) {
  try {
    const instructor = await db('instructors as i')
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

    return instructor;
  } catch (err) {
    console.error('❌ Lỗi trong instructorModel.findById():', err);
    throw err;
  }
}
export function update(userId, data) {
  return db('instructors').where('user_id', userId).update(data);
}
export function findCoursesByInstructor(instructorId) {
  return db('courses').where('instructor_id', instructorId);
}

export async function updateCourse(courseId, data) {
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

export async function getAllCategories() {
  try {
    const categories = await db('categories')
      .select('id', 'catname as name');
    return categories;
  } catch (err) {
    throw new Error('Lỗi khi lấy danh sách lĩnh vực: ' + err.message);
  }
}

export async function addCourse(courseData) {
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

export async function getCoursesByInstructor(instructorId) {
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


export async function getCourseById(id) {
  try {
    const course = await db('courses')
      .where('id', id)
      .first();
    return course;
  } catch (err) {
    throw new Error('Lỗi khi lấy thông tin khóa học: ' + err.message);
  }
}

export async function getLecturesByCourse(course_id) {
  try {
    return await db('lectures')
      .where('course_id', course_id)
      .orderBy('id', 'asc')
      .select('id', 'title', 'video_url');
  } catch (err) {
    throw new Error('Lỗi khi lấy danh sách bài giảng: ' + err.message);
  }
}

export async function addLecture(course_id, title, video_url) {
  try {
    const [lecture] = await db('lectures')
      .insert({
        course_id,
        title,
        video_url,

      })
      .returning(['id', 'title', 'video_url']);
    return lecture;
  } catch (err) {
    throw new Error('Lỗi khi thêm bài giảng: ' + err.message);
  }
}


export async function deleteLecture(id) {
  try {
    await db('lectures')
      .where('id', id)
      .del();
  } catch (err) {
    throw new Error('Lỗi khi xóa bài giảng: ' + err.message);
  }
}