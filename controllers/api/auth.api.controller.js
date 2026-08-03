import * as accountService from '../../services/account.service.js';
import { created, noContent, ok } from '../../utils/api-response.js';

export function csrfToken(req, res) {
  return ok(res, { csrfToken: req.session.csrfToken });
}

function regenerateSession(req) {
  const csrfToken = req.session.csrfToken;
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => {
      if (error) return reject(error);
      req.session.csrfToken = csrfToken;
      return resolve();
    });
  });
}

function userDto(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    dob: user.dob,
    permission: Number(user.permission),
    role: user.role,
  };
}

export function me(req, res) {
  return ok(res, userDto(req.user));
}

export async function login(req, res, next) {
  try {
    const user = await accountService.authenticate(req.body);
    await regenerateSession(req);
    req.session.isAuthenticated = true;
    req.session.authUser = accountService.toSessionUser(user);
    return ok(res, userDto(req.session.authUser));
  } catch (error) {
    return next(error);
  }
}

export async function register(req, res, next) {
  try {
    const user = await accountService.register(req.body);
    await regenerateSession(req);
    req.session.isAuthenticated = true;
    req.session.authUser = accountService.toSessionUser(user);
    return created(res, userDto(req.session.authUser));
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res, next) {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie('online_academy.sid');
    return noContent(res);
  });
}
