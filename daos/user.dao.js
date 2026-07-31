import db from '../utils/db.js';
import User from '../models/user.model.js';
import Permission from '../enums/Permission.js';

class UserDao {
  static async register(userData) {
    const user = new User(userData);
    const [result] = await db('users').insert({
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password,
      dob: user.dob,
      permission: user.permission,
      is_disabled: user.is_disabled,
    }).returning('*');
    return new User(result);
  }

  static add(userData) {
    return UserDao.register(userData);
  }

  static async findByUsername(username) {
    const row = await db('users').whereRaw('LOWER(username) = LOWER(?)', [username]).first();
    return row ? new User(row) : null;
  }

  static async findByName(name) {
    const row = await db('users').where('name', name).first();
    return row ? new User(row) : null;
  }

  static async findById(id) {
    const row = await db('users').where('id', id).first();
    return row ? new User(row) : null;
  }

  static updateProfile(id, data) {
    return db('users').where('id', id).update(data);
  }

  static patch(id, data) {
    return UserDao.updateProfile(id, data);
  }

  static changePassword(id, hashedPassword) {
    return db('users').where('id', id).update({ password: hashedPassword });
  }

  static findAll() {
    return db('users');
  }

  static findTeachers() {
    return db('users')
      .where('permission', Permission.INSTRUCTOR)
      .select('id', 'name', 'email', 'dob', 'permission');
  }

  static findStudents() {
    return db('users')
      .where('permission', Permission.STUDENT)
      .select('id', 'name', 'email', 'dob', 'permission');
  }

  static promoteToTeacher(id) {
    return db.transaction(async trx => {
      const updated = await trx('users')
        .where({ id, permission: Permission.STUDENT })
        .update({ permission: Permission.INSTRUCTOR });
      if (!updated) return 0;
      await trx('instructors').insert({ user_id: id }).onConflict('user_id').ignore();
      return updated;
    });
  }

  static deleteById(id) {
    return db('users').where({ id }).del();
  }

  static toggleDisable(id, disable) {
    return db('users').where('id', id).update({ is_disabled: disable });
  }

  static async findByEmail(email) {
    const row = await db('users').whereRaw('LOWER(email) = LOWER(?)', [email]).first();
    return row ? new User(row) : null;
  }
}

export default UserDao;

