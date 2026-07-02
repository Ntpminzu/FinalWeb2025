/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» User — Account Controller                         ║
 * ║  Class Diagram Methods → Controller Mapping:                 ║
 * ║                                                              ║
 * ║    + register(): bool                ✅ doSignup()           ║
 * ║    + login(): bool                   ✅ doSignin()           ║
 * ║    + logout(): void                  ✅ doLogout()           ║
 * ║    + updateProfile(): bool           ✅ updateProfile()      ║
 * ║    + changePassword(): bool          ✅ doChangePwd()        ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [01] Register, [02] Login,                                ║
 * ║    [21] Manage Profile, [22] Change Password                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import bcrypt from 'bcryptjs';

import UserDao from '../daos/user.dao.js';
import Permission from '../enums/Permission.js';

// ══════════════════════════════════════════
// UC [01] Register
// Class Diagram: User.register()
// ══════════════════════════════════════════

/**
 * Hiển thị form đăng ký.
 * UC [01] Main Flow Step 2.
 */
export function showSignup(req, res) {
  res.render('vwAccount/signup');
}

/**
 * Xử lý đăng ký tài khoản → tạo tài khoản ngay (không dùng OTP).
 * UC [01] Main Flow:
 *   3. Actor nhập thông tin
 *   4. Hệ thống kiểm tra tính hợp lệ (thiếu trường, email đã tồn tại)
 *   5. Băm mật khẩu, tạo user (permission = STUDENT) và chuyển tới trang đăng nhập
 *
 * Exception Flow:
 *   4.1. Thiếu trường bắt buộc
 *   4.2. Mật khẩu quá ngắn (<6 ký tự) — kiểm tra phía client
 *   4.3. Mật khẩu xác thực không khớp — kiểm tra phía client
 *   4.4. Email không hợp lệ — kiểm tra phía client
 *   4.6. Email đã tồn tại
 */
export async function doSignup(req, res) {
  try {
    // chấp nhận cả username hoặc name từ form
    const username = (req.body.username || req.body.name || '').trim();
    const password = req.body.password || '';
    const name = (req.body.name || username || '').trim();
    const email = (req.body.email || '').trim();
    const dob = req.body.dob || null;

    if (!username || !password || !email) {
      return res.status(400).render('vwAccount/signup', {
        systemError: true,
        message: 'Thiếu thông tin: tên đăng nhập, mật khẩu, email.',
      });
    }

    // kiểm tra email tồn tại
    const existsEmail = await UserDao.findByEmail(email);
    if (existsEmail) {
      return res.render('vwAccount/signup', { emailExist: true });
    }

    // băm mật khẩu & tạo tài khoản mới (permission = STUDENT)
    const hashed = bcrypt.hashSync(password, 10);

    // Class Diagram: User.register() — tạo user mới (permission = STUDENT)
    await UserDao.register({
      username,
      name,
      password: hashed,
      email,
      dob,
      permission: Permission.STUDENT,
      role: 'student',
    });

    // tạo tài khoản xong → chuyển sang trang đăng nhập
    return res.render('vwAccount/signin', { success: true });
  } catch (err) {
    console.error('❌ Lỗi tại signup:', err);
    return res.status(500).render('vwAccount/signup', {
      systemError: true,
      message: 'Đăng ký thất bại, vui lòng thử lại sau.',
    });
  }
}

// ══════════════════════════════════════════
// Check Username Available
// ══════════════════════════════════════════

export async function checkAvailable(req, res) {
  const u = (req.query.u || '').trim();
  if (!u) return res.json(false);

  const user =
    (await UserDao.findByUsername(u)) ||
    (await UserDao.findByName(u)) ||
    null;

  return res.json(!user);
}

// ══════════════════════════════════════════
// UC [02] Login
// Class Diagram: User.login()
// ══════════════════════════════════════════

/**
 * Hiển thị form đăng nhập.
 * UC [02] Main Flow Step 1.
 */
export function showSignin(req, res) {
  res.render('vwAccount/signin', { error: false });
}

/**
 * Xử lý đăng nhập.
 * UC [02] Main Flow:
 *   2. Actor nhập Username + Mật khẩu
 *   3. Hệ thống xác thực → đối chiếu CSDL
 *   4. Khởi tạo session + phân quyền (Permission enum)
 *   5. Chuyển hướng theo role
 *
 * Exception Flow:
 *   3.1. Thiếu username hoặc mật khẩu
 *   3.2. Sai thông tin đăng nhập
 *   3.3. Tài khoản bị khóa (is_disabled)
 */
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

// ══════════════════════════════════════════
// Class Diagram: User.logout()
// ══════════════════════════════════════════

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

// ══════════════════════════════════════════
// UC [21] Manage Profile
// Class Diagram: User.updateProfile()
// ══════════════════════════════════════════

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

// ══════════════════════════════════════════
// UC [22] Change Password
// Class Diagram: User.changePassword()
// ══════════════════════════════════════════

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
