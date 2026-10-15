import { ValidationError } from '../../../common/errors/app-error.js';
import { EMAIL_PATTERN, USERNAME_PATTERN } from '../../../common/schemas/common.schema.js';

export function signupSchema(input) {
  const username = String(input?.username || '').trim();
  const password = String(input?.password || '');
  const confirmPassword = String(input?.confirm_password ?? input?.confirmPassword ?? '');
  const name = String(input?.name || '').trim();
  const email = String(input?.email || '').trim().toLowerCase();
  const dob = input?.dob || null;
  if (dob !== null && (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(Date.parse(dob)) || new Date(dob).toISOString().slice(0, 10) !== dob)) throw new ValidationError('Ngày sinh không hợp lệ.');

  if (!USERNAME_PATTERN.test(username)) throw new ValidationError('Tên đăng nhập phải có 3–32 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.');
  if (name.length < 2 || name.length > 100) throw new ValidationError('Họ tên phải có từ 2 đến 100 ký tự.');
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new ValidationError('Email không hợp lệ.');
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) throw new ValidationError('Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte UTF-8.');
  if (password !== confirmPassword) throw new ValidationError('Mật khẩu xác nhận không khớp.');
  return { username, password, name, email, dob };
}

export function signinSchema(input) {
  const username = String(input?.username || '').trim();
  const password = String(input?.password || '');
  if (!username || !password) throw new ValidationError('Vui lòng nhập tên đăng nhập và mật khẩu.');
  return { username, password };
}
