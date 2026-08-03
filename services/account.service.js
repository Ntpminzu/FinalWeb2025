import bcrypt from 'bcrypt';
import UserDao from '../daos/user.dao.js';
import Permission from '../enums/Permission.js';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import { passwordSchema, profileSchema, signinSchema, signupSchema, USERNAME_PATTERN } from '../validators/account.schema.js';

export function toSessionUser(user) {
  return { id: user.id, username: user.username, name: user.name, email: user.email, dob: user.dob, permission: Number(user.permission), role: user.role, is_disabled: Boolean(user.is_disabled) };
}

export const findUserById = userId => UserDao.findById(userId);

export async function register(input) {
  const data = signupSchema(input);
  const [usernameOwner, emailOwner] = await Promise.all([UserDao.findByUsername(data.username), UserDao.findByEmail(data.email)]);
  if (usernameOwner) throw new ConflictError('Tên đăng nhập đã tồn tại.');
  if (emailOwner) throw new ConflictError('Email đã được sử dụng.');
  return UserDao.register({ ...data, password: await bcrypt.hash(data.password, 12), permission: Permission.STUDENT });
}

export async function isUsernameAvailable(value) {
  const username = String(value || '').trim();
  return USERNAME_PATTERN.test(username) && !(await UserDao.findByUsername(username));
}

export async function authenticate(input) {
  const { username, password } = signinSchema(input);
  const user = await UserDao.findByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.password || ''))) throw new UnauthorizedError('Tên đăng nhập hoặc mật khẩu không đúng.');
  if (user.is_disabled) throw new ForbiddenError('Tài khoản đã bị khóa.');
  return user;
}

export async function updateProfile(userId, input) {
  const data = profileSchema(input);
  const emailOwner = await UserDao.findByEmail(data.email);
  if (emailOwner && Number(emailOwner.id) !== Number(userId)) throw new ConflictError('Email đã được sử dụng.');
  await UserDao.updateProfile(userId, data);
  return data;
}

export async function changePassword(userId, input, requireConfirmation = false) {
  const { currentPassword, newPassword } = passwordSchema(input, requireConfirmation);
  const user = await UserDao.findById(userId);
  if (!user || !(await bcrypt.compare(currentPassword, user.password || ''))) throw new ValidationError('Mật khẩu hiện tại không đúng.');
  await UserDao.changePassword(userId, await bcrypt.hash(newPassword, 12));
}
