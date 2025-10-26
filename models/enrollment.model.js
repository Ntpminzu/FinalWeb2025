import db from '../utils/db.js';


export async function add(entities) {
    return db('enrollments').insert(entities);
}


export async function findCourseIdsByStudentId(studentId) {
    const list = await db('enrollments')
        .where('student_id', studentId)
        .select('course_id');

    return list.map(item => item.course_id.toString());
}