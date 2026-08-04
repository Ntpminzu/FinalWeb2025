import db from '../utils/db.js';

class IdempotencyDao {
  static find(userId, endpoint, idempotencyKey, trx = db) {
    return trx('idempotency_keys')
      .where({ user_id: userId, endpoint, idempotency_key: idempotencyKey })
      .first();
  }

  static save(userId, endpoint, idempotencyKey, requestFingerprint, statusCode, responseBody, trx = db) {
    return trx('idempotency_keys').insert({
      user_id: userId,
      endpoint,
      idempotency_key: idempotencyKey,
      request_fingerprint: requestFingerprint,
      status_code: statusCode,
      response_body: responseBody,
    });
  }
}

export default IdempotencyDao;
