import { ValidationError } from '../errors/app-error.js';
import { EMAIL_PATTERN, USERNAME_PATTERN, profileSchema } from './common.schema.js';

export function signupSchema(input) {
  const username = String(input?.username || '').trim();
  const password = String(input?.password || '');
  const confirmPassword = String(input?.confirm_password || '');
  const name = String(input?.name || '').trim();
  const email = String(input?.email || '').trim().toLowerCase();
  const dob = input?.dob || null;

  if (!USERNAME_PATTERN.test(username)) throw new ValidationError('Tên đăng nhập phải có 3–32 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.');
  if (name.length < 2 || name.length > 100) throw new ValidationError('Họ tên phải có từ 2 đến 100 ký tự.');
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new ValidationError('Email không hợp lệ.');
  if (password.length < 8 || password.length > 72) throw new ValidationError('Mật khẩu phải có từ 8 đến 72 ký tự.');
  if (password !== confirmPassword) throw new ValidationError('Mật khẩu xác nhận không khớp.');
  return { username, password, name, email, dob };
}

export function signinSchema(input) {
  const username = String(input?.username || '').trim();
  const password = String(input?.password || '');
  if (!username || !password) throw new ValidationError('Vui lòng nhập tên đăng nhập và mật khẩu.');
  return { username, password };
}

export function passwordSchema(input, requireConfirmation = false) {
  const currentPassword = String(input?.currentPassword || input?.curPassword || '');
  const newPassword = String(input?.newPassword || '');
  const confirmPassword = String(input?.confirmPassword || '');
  if (!currentPassword) throw new ValidationError('Vui lòng nhập mật khẩu hiện tại.');
  if (newPassword.length < 8 || newPassword.length > 72) throw new ValidationError('Mật khẩu mới phải có từ 8 đến 72 ký tự.');
  if (requireConfirmation && newPassword !== confirmPassword) throw new ValidationError('Mật khẩu xác nhận không khớp.');
  return { currentPassword, newPassword };
}

export { profileSchema, USERNAME_PATTERN };
