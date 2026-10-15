import { ValidationError } from '../../../common/errors/app-error.js';
import { EMAIL_PATTERN } from '../../../common/schemas/common.schema.js';

export function passwordSchema(input, requireConfirmation = false) {
  const currentPassword = String(input?.currentPassword || input?.curPassword || '');
  const newPassword = String(input?.newPassword || '');
  const confirmPassword = String(input?.confirmPassword || '');
  if (!currentPassword) throw new ValidationError('Vui lòng nhập mật khẩu hiện tại.');
  if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) throw new ValidationError('Mật khẩu mới cần ít nhất 8 ký tự và tối đa 72 byte UTF-8.');
  if (requireConfirmation && newPassword !== confirmPassword) throw new ValidationError('Mật khẩu xác nhận không khớp.');
  return { currentPassword, newPassword };
}

export function profileSchema(input) {
  const name = String(input?.name || '').trim();
  const email = String(input?.email || '').trim().toLowerCase();
  if (name.length < 2 || name.length > 100 || !EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new ValidationError('Thông tin hồ sơ không hợp lệ.');
  }
  return { name, email };
}
