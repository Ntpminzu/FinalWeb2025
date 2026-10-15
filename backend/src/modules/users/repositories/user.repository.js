import db from '../../../config/database.js';
import User from '../domain/user.model.js';
import Permission from '../../../common/enums/Permission.js';

class UserRepository {
  // Serialize writes for one account, including an empty cart.
  static lock(id, connection) {
    return connection('users').where({ id }).forUpdate().first('id');
  }
  static async listPage(filters) {
    const query = db('users');
    if (filters.q) query.where(builder => builder.whereILike('name', `%${filters.q}%`).orWhereILike('username', `%${filters.q}%`).orWhereILike('email', `%${filters.q}%`));
    if (filters.permission !== null) query.where('permission', filters.permission);
    if (filters.disabled !== null) query.where('is_disabled', filters.disabled);
    const total = await query.clone().count('* as count').first();
    const items = await query.select('id', 'name', 'username', 'email', 'dob', 'permission', 'is_disabled').orderBy('id').limit(filters.limit).offset(filters.offset);
    return { items, total: Number(total.count) };
  }
  static async dependencies(id, connection = db) {
    const purchases = await connection('purchased').where('user_id', id).count('* as count').first();
    const courses = await connection('courses').where('instructor_id', id).count('* as count').first();
    return Number(purchases.count) + Number(courses.count);
  }
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
    return UserRepository.register(userData);
  }

  static async findByUsername(username) {
    const row = await db('users').whereRaw('LOWER(username) = LOWER(?)', [username]).first();
    return row ? new User(row) : null;
  }

  static async findByName(name) {
    const row = await db('users').where('name', name).first();
    return row ? new User(row) : null;
  }

  static async findById(id, connection = db) {
    const row = await connection('users').where('id', id).first();
    return row ? new User(row) : null;
  }

  static updateProfile(id, data) {
    return db('users').where('id', id).update(data);
  }

  static patch(id, data) {
    return UserRepository.updateProfile(id, data);
  }

  static changePassword(id, hashedPassword, connection = db) {
    return connection('users').where('id', id).update({ password: hashedPassword });
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

  static deleteById(id, connection = db) {
    return connection('users').where({ id }).del();
  }

  static toggleDisable(id, disable) {
    return db('users').where('id', id).update({ is_disabled: disable });
  }

  static async findByEmail(email) {
    const row = await db('users').whereRaw('LOWER(email) = LOWER(?)', [email]).first();
    return row ? new User(row) : null;
  }
}

export default UserRepository;
