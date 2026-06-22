import db from '../utils/db.js';
import OtpToken from '../models/otp-token.model.js';

class OtpTokenDao {
  static async add(email, otpCode, expiresMinutes = 5) {
    const expires = new Date(Date.now() + expiresMinutes * 60 * 1000);
    const row = {
      email,
      otp_code: otpCode.toString(),
      expires_at: expires,
      created_at: new Date()
    };
    await db('otp_tokens').insert(row);
    return new OtpToken(row);
  }

  static async findLatestByEmail(email) {
    const row = await db('otp_tokens')
      .where({ email })
      .orderBy('created_at', 'desc')
      .first();
    return row ? new OtpToken(row) : null;
  }

  static async deleteByEmail(email) {
    return db('otp_tokens').where('email', email).del();
  }
}

export default OtpTokenDao;
