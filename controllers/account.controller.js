import bcrypt from 'bcryptjs';

import UserDao from '../daos/user.dao.js';
import Permission from '../enums/Permission.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toSessionUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    dob: user.dob,
    permission: Number(user.permission),
    role: user.role,
    is_disabled: Boolean(user.is_disabled),
  };
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => error ? reject(error) : resolve());
  });
}

export function showSignup(req, res) {
  res.render('vwAccount/signup');
}

export async function doSignup(req, res) {
  const username = (req.body.username || '').trim();
  const password = req.body.password || '';
  const confirmPassword = req.body.confirm_password || '';
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const dob = req.body.dob || null;

  const renderError = (message, status = 400) => res.status(status).render('vwAccount/signup', {
    systemError: true,
    message,
    form: { username, name, email, dob },
  });

  try {
    if (!USERNAME_PATTERN.test(username)) {
      return renderError('Tên đăng nhập phải có 3–32 ký tự và chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.');
    }
    if (name.length < 2 || name.length > 100) return renderError('Họ tên phải có từ 2 đến 100 ký tự.');
    if (!EMAIL_PATTERN.test(email) || email.length > 254) return renderError('Email không hợp lệ.');
    if (password.length < 8 || password.length > 72) return renderError('Mật khẩu phải có từ 8 đến 72 ký tự.');
    if (password !== confirmPassword) return renderError('Mật khẩu xác nhận không khớp.');

    const [existsUsername, existsEmail] = await Promise.all([
      UserDao.findByUsername(username),
      UserDao.findByEmail(email),
    ]);
    if (existsUsername) return renderError('Tên đăng nhập đã tồn tại.', 409);
    if (existsEmail) return renderError('Email đã được sử dụng.', 409);

    const hashed = await bcrypt.hash(password, 12);
    await UserDao.register({
      username,
      name,
      password: hashed,
      email,
      dob,
      permission: Permission.STUDENT,
    });
    return res.redirect('/account/signin?registered=1');
  } catch (error) {
    console.error('Signup error:', error);
    if (error?.code === '23505') return renderError('Tên đăng nhập hoặc email đã tồn tại.', 409);
    return renderError('Đăng ký thất bại, vui lòng thử lại sau.', 500);
  }
}

export async function checkAvailable(req, res, next) {
  try {
    const username = (req.query.u || '').trim();
    if (!USERNAME_PATTERN.test(username)) return res.json(false);
    return res.json(!(await UserDao.findByUsername(username)));
  } catch (error) {
    return next(error);
  }
}

export function showSignin(req, res) {
  res.render('vwAccount/signin', {
    error: false,
    success: req.query.registered === '1',
    disabled: req.query.disabled === '1',
  });
}

export async function doSignin(req, res, next) {
  try {
    const username = (req.body.username || '').trim();
    const password = req.body.password || '';
    if (!username || !password) return res.status(400).render('vwAccount/signin', { error: true });

    const user = await UserDao.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password || ''))) {
      return res.status(401).render('vwAccount/signin', { error: true });
    }
    if (user.is_disabled) {
      return res.status(403).render('vwAccount/signin', { error: true, disabled: true });
    }

    const retUrl = req.session.retUrl;
    await regenerateSession(req);
    req.session.isAuthenticated = true;
    req.session.authUser = toSessionUser(user);

    if (retUrl && retUrl.startsWith('/') && !retUrl.startsWith('//')) return res.redirect(retUrl);
    switch (Number(user.permission)) {
      case Permission.STUDENT: return res.redirect('/student');
      case Permission.INSTRUCTOR: return res.redirect('/instructor');
      case Permission.ADMIN: return res.redirect('/admin');
      default: return res.redirect('/');
    }
  } catch (error) {
    return next(error);
  }
}

export function doLogout(req, res, next) {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie('online_academy.sid');
    return res.redirect('/');
  });
}

export const doSignout = doLogout;

export function showProfile(req, res) {
  res.render('vwAccount/profile', { user: req.session.authUser });
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    if (name.length < 2 || name.length > 100 || !EMAIL_PATTERN.test(email)) {
      return res.status(400).render('vwAccount/profile', { user: req.session.authUser, error: 'Thông tin không hợp lệ.' });
    }
    const emailOwner = await UserDao.findByEmail(email);
    if (emailOwner && Number(emailOwner.id) !== Number(userId)) {
      return res.status(409).render('vwAccount/profile', { user: req.session.authUser, error: 'Email đã được sử dụng.' });
    }
    await UserDao.updateProfile(userId, { name, email });
    req.session.authUser = { ...req.session.authUser, name, email };
    return res.render('vwAccount/profile', { user: req.session.authUser, success: 'Cập nhật thành công.' });
  } catch (error) {
    return next(error);
  }
}

export function showChangePwd(req, res) {
  res.render('vwAccount/change-pwd', { user: req.session.authUser });
}

export async function doChangePwd(req, res, next) {
  try {
    const userId = req.session.authUser.id;
    const currentPassword = req.body.currentPassword || req.body.curPassword || '';
    const newPassword = req.body.newPassword || '';
    const confirmPassword = req.body.confirmPassword || '';
    const user = await UserDao.findById(userId);

    if (!user || !(await bcrypt.compare(currentPassword, user.password || ''))) {
      return res.status(400).render('vwAccount/change-pwd', { user: req.session.authUser, error: true });
    }
    if (newPassword.length < 8 || newPassword.length > 72 || newPassword !== confirmPassword) {
      return res.status(400).render('vwAccount/change-pwd', {
        user: req.session.authUser,
        error: true,
        message: 'Mật khẩu mới phải có 8–72 ký tự và phần xác nhận phải khớp.',
      });
    }

    await UserDao.changePassword(userId, await bcrypt.hash(newPassword, 12));
    return res.redirect('/account/profile?passwordChanged=1');
  } catch (error) {
    return next(error);
  }
}
