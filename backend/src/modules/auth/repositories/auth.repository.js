import db from '../../../config/database.js';

export default class AuthRepository {
  static async createSession(session, tokenHash, connection = db) {
    await connection('auth_sessions').insert(session);
    await this.addToken(session.id, tokenHash, connection);
  }
  static findToken(hash, connection = db) {
    return connection('refresh_tokens').where({ token_hash: hash }).first();
  }
  static findSession(id, connection = db, lock = false) {
    const query = connection('auth_sessions').where({ id });
    return (lock ? query.forUpdate() : query).first();
  }
  static addToken(sessionId, hash, connection = db) {
    return connection('refresh_tokens').insert({ session_id: sessionId, token_hash: hash });
  }
  static useToken(hash, connection = db) {
    return connection('refresh_tokens').where({ token_hash: hash }).update({ used_at: new Date() });
  }
  static revoke(id, connection = db) {
    return connection('auth_sessions').where({ id }).whereNull('revoked_at').update({ revoked_at: new Date() });
  }
  static revokeAll(userId, connection = db) {
    return connection('auth_sessions').where({ user_id: userId }).whereNull('revoked_at').update({ revoked_at: new Date() });
  }
}
