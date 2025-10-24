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