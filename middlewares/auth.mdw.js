import UserDao from '../daos/user.dao.js';
import Permission from '../enums/Permission.js';

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

async function requireUser(req, res, next, permission = null) {
  try {
    const userId = req.session?.authUser?.id;
    if (!req.session?.isAuthenticated || !userId) {
      req.session.retUrl = req.originalUrl;
      return res.redirect('/account/signin');
    }

    const user = await UserDao.findById(userId);
    if (!user || user.is_disabled) {
      return req.session.destroy(() => res.redirect('/account/signin?disabled=1'));
    }

    if (permission !== null && Number(user.permission) !== permission) {
      return res.status(403).render('403', { message: 'Bạn không có quyền truy cập chức năng này.' });
    }

    req.session.authUser = toSessionUser(user);
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.session.authUser;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function restrict(req, res, next) {
  return requireUser(req, res, next);
}

export function restrictStudent(req, res, next) {
  return requireUser(req, res, next, Permission.STUDENT);
}

export function restrictInstructor(req, res, next) {
  return requireUser(req, res, next, Permission.INSTRUCTOR);
}

export function restrictAdmin(req, res, next) {
  return requireUser(req, res, next, Permission.ADMIN);
}
