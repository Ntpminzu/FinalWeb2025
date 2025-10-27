import db from '../utils/db.js';

export async function all() {
    // 1. Lấy tất cả danh mục từ DB
    const allCategories = await db('categories');

    const categories = []; // Mảng kết quả (chỉ chứa cha)
    const map = {}; // Dùng để tìm danh mục theo ID

    // 2. Tạo một bản đồ (map) để truy cập nhanh
    allCategories.forEach(cat => {
        map[cat.id] = {
            ...cat,
            children: [] // Thêm mảng 'children'
        };
    });

    // 3. Xây dựng cây
    allCategories.forEach(cat => {
        if (cat.parent_id !== null && cat.parent_id !== undefined) {
            // Nếu đây là danh mục con -> tìm cha của nó (map[cat.parent_id])
            // và thêm nó vào mảng 'children' của cha
            if (map[cat.parent_id]) {
                map[cat.parent_id].children.push(map[cat.id]);
            }
        } else {
            // Nếu đây là danh mục cha (parent_id là NULL)
            // -> thêm nó vào mảng kết quả
            categories.push(map[cat.id]);
        }
    });

    return categories; // Trả về mảng cây đã lồng nhau
}

export async function findById(id) {
    const list = await db('categories').where('id', id);
    if (list.length === 0)
        return null;
    return list[0];
}

export async function add(category) {
  return await db('categories').insert({ catname: category.name });
}

export async function patch(id, category) {
  return await db('categories').where('id', id).update({ catname: category.name });
}

export async function remove(id) {
  return await db('categories').where('id', id).del();
}
export async function findChildIds(parentId) {
    const children = await db('categories')
        .where('parent_id', parentId)
        .select('id');

    // Trả về một mảng ID đơn giản, ví dụ: [9, 10]
    return children.map(child => child.id);
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
export async function getAllWithCourseCount() {
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
