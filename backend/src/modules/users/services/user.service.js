import bcrypt from 'bcrypt';
import UserRepository from '../repositories/user.repository.js';
import AuthRepository from '../../auth/repositories/auth.repository.js';
import { transaction } from '../../../common/database/transaction.js';
import { ConflictError, ValidationError } from '../../../common/errors/app-error.js';
import { passwordSchema, profileSchema } from '../schemas/user.schema.js';

export function toSessionUser(user) {
  return { id: user.id, username: user.username, name: user.name, email: user.email, dob: user.dob, permission: Number(user.permission), role: user.role, is_disabled: Boolean(user.is_disabled) };
}

export const findUserById = userId => UserRepository.findById(userId);

export async function updateProfile(userId, input) {
  const data = profileSchema(input);
  const emailOwner = await UserRepository.findByEmail(data.email);
  if (emailOwner && Number(emailOwner.id) !== Number(userId)) throw new ConflictError('Email đã được sử dụng.');
  await UserRepository.updateProfile(userId, data);
  return data;
}

export async function changePassword(userId, input, requireConfirmation = false) {
  const { currentPassword, newPassword } = passwordSchema(input, requireConfirmation);
  const user = await UserRepository.findById(userId);
  if (!user || !(await bcrypt.compare(currentPassword, user.password || ''))) throw new ValidationError('Mật khẩu hiện tại không đúng.');
  const hash = await bcrypt.hash(newPassword, 12);
  await transaction(async connection => {
    await UserRepository.changePassword(userId, hash, connection);
    await AuthRepository.revokeAll(userId, connection);
  });
}
