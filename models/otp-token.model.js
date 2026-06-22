class OtpToken {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || null;
    this.otp_code = data.otp_code || null;
    this.expires_at = data.expires_at || null;
    this.created_at = data.created_at || null;
  }

  isExpired() {
    if (!this.expires_at) return true;
    return new Date() > new Date(this.expires_at);
  }

  validate() {
    if (!this.email) throw new Error('Email must not be empty');
    if (!this.otp_code) throw new Error('OTP code must not be empty');
    return true;
  }
}

export default OtpToken;
