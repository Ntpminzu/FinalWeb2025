import db from '../utils/db.js';

export function add(user) {
  return db('users').insert(user);
}

export function findByName(name) {
  return db('users').where('name', name).first();
}

export function patch(id, user) {
  return db('users').where('id', id).update(user);
}