import db from '../utils/db.js';


export async function add(entities) {
    return db('enrollments').insert(entities);
}

export async function findCourseIdsByUserId(userId) {
    const list = await db('enrollments')
        .where('user_id', userId)
        .select('course_id'); // Chỉ lấy cột course_id

    // Chuyển mảng object [{course_id: 11}, {course_id: 14}] 
    // thành mảng đơn giản ['11', '14']
    return list.map(item => item.course_id.toString());
}