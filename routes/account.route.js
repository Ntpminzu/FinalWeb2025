import express from 'express';
import bcrypt from 'bcryptjs';
import * as userModel from '../models/user.model.js';
import { restrict } from '../middlewares/auth.mdw.js';

const router = express.Router();

router.get('/signup', function (req, res) {
  res.render('vwAccount/signup');
});

router.post('/signup', async function (req, res) {
  const hash_password = bcrypt.hashSync(req.body.password, 10);
  const user = {
    name: req.body.name,
    password: hash_password,
    email: req.body.email,
    permission: 1
  }
  await userModel.add(user);
  res.render('vwAccount/signup');
});

router.get('/is-available', async function (req, res) {
  const u = req.query.u;
  const user = await userModel.findByName(u);
  if (!user) {
    return res.json(true);
  }
  res.json(false);
});

router.get('/signin', function (req, res) {
  res.render('vwAccount/signin', {
    error: false
  });
});

router.post('/signin', async function (req, res) {
  const user = await userModel.findByName(req.body.name?.trim());
  if (!user) {
    return res.render('vwAccount/signin', { error: true });
  }

  const password_match = bcrypt.compareSync(req.body.password || '', user.password || '');
  if (!password_match) {
    return res.render('vwAccount/signin', { error: true });
  }

  // ✅ Lưu session
  req.session.isAuthenticated = true;
  req.session.authUser = user;

  // ✅ Điều hướng theo permission
  switch (user.permission) {
    case 1: // student
      return res.redirect('/student');
    case 2: // instructor
      return res.redirect('/instructor');
    case 3: // admin
      return res.redirect('/admin');
    default:
      // Nếu không khớp giá trị nào, quay về trang chủ
      const retUrl = req.session.retUrl || '/';
      delete req.session.retUrl;
      return res.redirect(retUrl);
  }
});


router.post('/signout', function (req, res) {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect(req.headers.referer);
});

router.get('/profile', restrict, function (req, res) {
  res.render('vwAccount/profile', {
    user: req.session.authUser
  });
});

router.post('/profile', restrict, async function (req, res) {
  const id = req.body.id;
  const user = {
    name: req.body.name,
    email: req.body.email,
  };
  await userModel.patch(id, user);

  req.session.authUser.name = req.body.name;
  req.session.authUser.email = req.body.email;

  res.render('vwAccount/profile', {
    user: req.session.authUser
  });
});

router.get('/change-pwd', restrict, function (req, res) {
  res.render('vwAccount/change-pwd', {
    user: req.session.authUser,
  });
});

router.post('/change-pwd', restrict, async function (req, res) {
  const id = req.body.id;
  const curpwd = req.body.currentPassword;
  const newpwd = req.body.newPassword;

  const ret = bcrypt.compareSync(curpwd, req.session.authUser.password);
  if (ret === false) {
    return res.render('vwAccount/change-pwd', {
      user: req.session.authUser,
      error: true
    });
  }

  const hash_password = bcrypt.hashSync(newpwd, 10);
  const user = {
    password: hash_password
  };
  await userModel.patch(id, user);
  req.session.authUser.password = hash_password;

  res.redirect('/account/profile');
});

export default router;