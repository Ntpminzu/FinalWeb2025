import bcrypt from 'bcrypt';
import UserRepository from '../../users/repositories/user.repository.js';
import Permission from '../../../common/enums/Permission.js';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../../../common/errors/app-error.js';
import { signinSchema, signupSchema } from '../schemas/auth.schema.js';
import { USERNAME_PATTERN } from '../../../common/schemas/common.schema.js';

export async function register(input) {
  const data = signupSchema(input);
  const [usernameOwner, emailOwner] = await Promise.all([UserRepository.findByUsername(data.username), UserRepository.findByEmail(data.email)]);
  if (usernameOwner) throw new ConflictError('Tên đăng nhập đã tồn tại.');
  if (emailOwner) throw new ConflictError('Email đã được sử dụng.');
  return UserRepository.register({ ...data, password: await bcrypt.hash(data.password, 12), permission: Permission.STUDENT });
}

export async function isUsernameAvailable(value) {
  const username = String(value || '').trim();
  return USERNAME_PATTERN.test(username) && !(await UserRepository.findByUsername(username));
}

export async function authenticate(input) {
  const { username, password } = signinSchema(input);
  const user = await UserRepository.findByUsername(username);
  if (!user || !(await bcrypt.compare(password, user.password || ''))) throw new UnauthorizedError('Tên đăng nhập hoặc mật khẩu không đúng.');
  if (user.is_disabled) throw new ForbiddenError('Tài khoản đã bị khóa.');
  return user;
}
