import db from '../utils/db.js';

export async function all() {
    return db('categories');
}

export async function findById(id) {
    const list = await db('categories').where('id', id);
    if (list.length === 0)
        return null;
    return list[0];
}

export async function add(entity) {
    return db('categories').insert(entity);
}

export async function update(id, entity) {
    return db('categories').where('id', id).update(entity);
}

export async function del(id) {
    return db('categories').where('id', id).del();
}


export async function findMostEnrolledPastWeek(limit = 5) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return db('categories as cat')
        .join('courses as c', 'c.category_id', 'cat.id')
        .join('enrollments as e', 'e.course_id', 'c.id')
        .where('e.enrolled_at', '>=', sevenDaysAgo) // Lọc 7 ngày qua
        .select(
            'cat.id',
            'cat.catname',
            db.raw('COUNT(e.id) as enroll_count') // Đếm số lượt đăng ký
        )
        .groupBy('cat.id', 'cat.catname')
        .orderBy('enroll_count', 'desc') // Sắp xếp
        .limit(limit);
}