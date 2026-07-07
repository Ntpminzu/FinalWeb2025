import bcrypt from 'bcryptjs';

import UserDao from '../daos/user.dao.js';
import User from '../models/user.model.js';
import Permission from '../enums/Permission.js';

// UC [01] Register
// Class Diagram: User.register()

export function showSignup(req, res) {
  res.render('vwAccount/signup');
}

export async function doSignup(req, res) {
  // chấp nhận cả username hoặc name từ form
  const username = (req.body.username || req.body.name || '').trim();
  const password = req.body.password || '';
  const confirmPassword = req.body.confirm_password || '';
  const name = (req.body.name || username || '').trim();
  const email = (req.body.email || '').trim();
  const dob = req.body.dob || null;

  // giữ lại dữ liệu đã nhập để render lại form khi có lỗi (UX)
  const formData = { username, name, email, dob };

  try {
    // (1) Input-level: xác nhận mật khẩu khớp — kiểm tra đầu vào (2 ô form),
    //     không phải bất biến của Entity User nên đặt ở Controller.
    if (password !== confirmPassword) {
      return res.status(400).render('vwAccount/signup', {
        ...formData,
        message: 'Mật khẩu xác nhận không khớp.',
      });
    }

    // (2) Business-layer: để chính Entity User tự kiểm tra bất biến nghiệp vụ
    //     (tên đăng nhập, email hợp lệ, mật khẩu >= 6 ký tự...). Validate mật khẩu GỐC.
    try {
      new User({ username, name, email, password, dob, permission: Permission.STUDENT }).validate();
    } catch (e) {
      return res.status(400).render('vwAccount/signup', { ...formData, message: e.message });
    }

    // (3) Kiểm tra email đã tồn tại chưa
    const existsEmail = await UserDao.findByEmail(email);
    if (existsEmail) {
      return res.status(400).render('vwAccount/signup', { ...formData, emailExist: true });
    }

    // (4) Băm mật khẩu & tạo tài khoản mới (permission = STUDENT)
    const hashed = bcrypt.hashSync(password, 10);
    await UserDao.register({
      username,
      name,
      password: hashed,
      email,
      dob,
      permission: Permission.STUDENT,
      role: 'student',
    });

    // (5) Tạo tài khoản xong → chuyển sang trang đăng nhập
    return res.render('vwAccount/signin', { success: true });
  } catch (err) {
    console.error('❌ Lỗi tại signup:', err);
    return res.status(500).render('vwAccount/signup', {
      ...formData,
      message: 'Đăng ký thất bại, vui lòng thử lại sau.',
    });
  }
}


// Check Username Available

export async function checkAvailable(req, res) {
  const u = (req.query.u || '').trim();
  if (!u) return res.json(false);

  const user =
    (await UserDao.findByUsername(u)) ||
    (await UserDao.findByName(u)) ||
    null;

  return res.json(!user);
}

// UC [02] Login
// Class Diagram: User.login()

export function showSignin(req, res) {
  res.render('vwAccount/signin', { error: false });
}

export async function doSignin(req, res) {
  try {
    const username = (req.body.username || req.body.name || '').trim();
    const password = req.body.password || '';

    const user =
      (await UserDao.findByUsername(username)) ||
      (await UserDao.findByName(username)) ||
      null;

    // Exception 3.2: Không tồn tại user
    if (!user) {
      return res.render('vwAccount/signin', { error: true });
    }

    // Exception 3.3: Bị vô hiệu hóa
    if (user.is_disabled === true || user.is_disabled === 'TRUE' || user.is_disabled === 1) {
      return res.render('vwAccount/signin', {
        error: true,
        disabled: true,
      });
    }

    // So khớp mật khẩu
    const ok = bcrypt.compareSync(password, user.password || '');
    if (!ok) {
      return res.render('vwAccount/signin', { error: true });
    }

    // Lưu session & điều hướng theo permission (Permission enum)
    req.session.isAuthenticated = true;
    req.session.authUser = user;

    switch (Number(user.permission)) {
      case Permission.STUDENT: return res.redirect('/student');
      case Permission.INSTRUCTOR: return res.redirect('/instructor');
      case Permission.ADMIN: return res.redirect('/admin');
      default: {
        const retUrl = req.session.retUrl || '/';
        delete req.session.retUrl;
        return res.redirect(retUrl);
      }
    }
  } catch (err) {
    console.error('❌ Signin error:', err);
    return res.render('vwAccount/signin', { error: true });
  }
}

// Class Diagram: User.logout()

/**
 * Đăng xuất — xóa session.
 */
export function doLogout(req, res) {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect(req.headers.referer || '/');
}

// alias cho file cũ
export function doSignout(req, res) {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect(req.headers.referer || '/');
}

// UC [21] Manage Profile
// Class Diagram: User.updateProfile()

export function showProfile(req, res) {
  res.render('vwAccount/profile', { user: req.session.authUser });
}

export async function updateProfile(req, res) {
  const id = req.body.id;
  const userPatch = {
    name: (req.body.name || '').trim(),
    email: (req.body.email || '').trim(),
  };
  await UserDao.updateProfile(id, userPatch);
  req.session.authUser = { ...req.session.authUser, ...userPatch };

  res.render('vwAccount/profile', { user: req.session.authUser });
}

// UC [22] Change Password
// Class Diagram: User.changePassword()

export function showChangePwd(req, res) {
  res.render('vwAccount/change-pwd', { user: req.session.authUser });
}

export async function doChangePwd(req, res) {
  const id = req.body.id;
  const curPwd = req.body.currentPassword || req.body.curPassword || '';
  const newPwd = req.body.newPassword || '';

  const ok = bcrypt.compareSync(curPwd, req.session.authUser.password || '');
  if (!ok) {
    return res.render('vwAccount/change-pwd', {
      user: req.session.authUser,
      error: true,
    });
  }

  const hashed = bcrypt.hashSync(newPwd, 10);
  await UserDao.changePassword(id, hashed);
  req.session.authUser.password = hashed;

  res.redirect('/account/profile');
}
