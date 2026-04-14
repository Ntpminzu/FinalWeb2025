// routes/account.route.js — Unified

import express from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

import db from '../utils/db.js';
import * as userModel from '../models/user.model.js';
import { restrict } from '../middlewares/auth.mdw.js';

const router = express.Router();

/* =========================
 * 1) SIGN UP (SEND OTP)
 * ======================= */
router.get('/signup', (req, res) => {
  res.render('vwAccount/signup');
});

router.post('/signup', async (req, res) => {
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

    if (password.length < 6) {
      return res.status(400).render('vwAccount/signup', {
        systemError: true,
        message: 'Mật khẩu phải có ít nhất 6 ký tự.',
      });
    }

    // kiểm tra email tồn tại
    const existsEmail = await db('users').where('email', email);
    if (existsEmail.length > 0) {
      return res.render('vwAccount/signup', { emailExist: true });
    }

    // tạo & lưu OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await db('otp_tokens').insert({
      email,
      otp_code: otp.toString(),
      expires_at: expires,
      created_at: new Date(),
    });

    // gửi mail OTP (Mailtrap sandbox)
    // Looking to send emails in production? Check out our Email API/SMTP product!
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "325d3a4b14039a",
        pass: "17b0afcd916ef6"
      }
    });

    await transporter.sendMail({
      from: '"FinalWeb System" <noreply@finalweb.com>',
      to: email,
      subject: 'Mã xác nhận OTP',
      text: `Xin chào ${name}, mã OTP của bạn là ${otp}. Mã có hiệu lực trong 5 phút.`,
    });

    // Lưu dữ liệu đăng ký tạm ở server session để không đẩy password xuống client.
    req.session.pendingSignup = {
      username,
      name,
      email,
      dob,
      passwordHash: bcrypt.hashSync(password, 10),
    };

    // chuyển sang trang nhập OTP
    return res.render('vwAccount/verify-otp', {
      email,
    });
  } catch (err) {
    console.error('❌ Lỗi tại signup:', err);
    return res.status(500).render('vwAccount/signup', {
      systemError: true,
      message: 'Đăng ký thất bại, vui lòng thử lại sau.',
    });
  }
});

/* =========================
 * 2) VERIFY OTP
 * ======================= */
router.post('/verify-otp', async (req, res) => {
  try {
    const otp = (req.body.otp || '').trim();
    const pending = req.session.pendingSignup;

    if (!pending) {
      return res.status(400).send('❌ Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.');
    }

    const { username, name, email, dob, passwordHash } = pending;

    if (!email || !username || !passwordHash) {
      return res.status(400).send('❌ Thiếu thông tin. Vui lòng đăng ký lại.');
    }

    const [record] = await db('otp_tokens')
      .where({ email })
      .orderBy('created_at', 'desc')
      .limit(1);

    if (!record) return res.send('❌ Không tìm thấy mã OTP.');
    if (record.otp_code !== otp) return res.send('❌ Mã OTP không đúng.');
    if (new Date() > record.expires_at) return res.send('❌ Mã OTP đã hết hạn.');

    // tạo user: mặc định student
    await db('users').insert({
      username,            // nếu schema không có cột username, đổi thành name
      name,                // giữ thêm tên hiển thị
      password: passwordHash,
      email,
      dob,
      permission: 1,       // 1: student, 2: instructor, 3: admin
      role: 'student',

    });

    // xoá otp đã dùng
    await db('otp_tokens').where('email', email).del();
    delete req.session.pendingSignup;

    return res.render('vwAccount/signin', { success: true });
  } catch (err) {
    console.error('❌ Lỗi tại verify-otp:', err); // xem terminal để biết cột nào sai
    return res.status(500).send(`Lỗi xác nhận OTP: ${err.message}`);
  }
});



/* =========================
 * 3) CHECK USERNAME AVAILABLE
 * ======================= */
router.get('/is-available', async (req, res) => {
  const u = (req.query.u || '').trim();
  if (!u) return res.json(false);

  // tương thích cả 2 kiểu hàm của userModel
  const user =
    (await userModel.findByUsername?.(u)) ||
    (await userModel.findByName?.(u)) ||
    null;

  return res.json(!user);
});

/* =========================
 * 4) SIGN IN
 * ======================= */
router.get('/signin', (req, res) => {
  res.render('vwAccount/signin', { error: false });
});

router.post('/signin', async (req, res) => {
  try {
    const username = (req.body.username || req.body.name || '').trim();
    const password = req.body.password || '';
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ua = req.headers['user-agent'] || 'unknown';

    if (!username || !password) {
      return res.render('vwAccount/signin', { error: true });
    }

    const user =
      (await userModel.findByUsername?.(username)) ||
      (await userModel.findByName?.(username)) ||
      null;

    if (!user) {
      console.warn('LOGIN_FAILED USER_NOT_FOUND', { username, ip, ua });
      return res.render('vwAccount/signin', { error: true });
    }

    if (user.is_disabled) {
      console.warn('LOGIN_BLOCKED ACCOUNT_DISABLED', { userId: user.id, username, ip, ua });
      return res.render('vwAccount/signin', { disabled: true });
    }

    const ok = bcrypt.compareSync(password, user.password || '');
    if (!ok) {
      console.warn('LOGIN_FAILED WRONG_PASSWORD', { userId: user.id, username, ip, ua });
      return res.render('vwAccount/signin', { error: true });
    }

    console.info('LOGIN_SUCCESS', { userId: user.id, username, permission: user.permission, ip, ua });
    req.session.isAuthenticated = true;
    req.session.authUser = user;
    return res.redirect('/student');
  } catch (err) {
    console.error('LOGIN_ERROR', err);
    return res.status(500).render('vwAccount/signin', {
      systemError: true,
      message: 'Không thể đăng nhập lúc này, vui lòng thử lại.',
    });
  }
});



/* =========================
 * 5) SIGN OUT
 * ======================= */
router.post('/logout', (req, res) => {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect(req.headers.referer || '/');
});
// alias cho file cũ
router.post('/signout', (req, res) => {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect(req.headers.referer || '/');
});

/* =========================
 * 6) PROFILE
 * ======================= */
router.get('/profile', restrict, (req, res) => {
  res.render('vwAccount/profile', { user: req.session.authUser });
});

router.post('/profile', restrict, async (req, res) => {
  const id = req.session.authUser.id;
  const userPatch = {
    name: (req.body.name || '').trim(),
    email: (req.body.email || '').trim(),
  };
  await userModel.patch(id, userPatch);
  req.session.authUser = { ...req.session.authUser, ...userPatch };

  res.render('vwAccount/profile', { user: req.session.authUser });
});

/* =========================
 * 7) CHANGE PASSWORD
 * ======================= */
router.get('/change-pwd', restrict, (req, res) => {
  res.render('vwAccount/change-pwd', { user: req.session.authUser });
});

router.post('/change-pwd', restrict, async (req, res) => {
  const id = req.session.authUser.id;
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
  await userModel.patch(id, { password: hashed });
  req.session.authUser.password = hashed;

  res.redirect('/account/profile');
});

export default router;
