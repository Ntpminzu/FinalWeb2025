import { userDto } from '../../users/dto/user.dto.js';
import * as authService from '../services/auth.service.js';
import * as tokenService from '../services/token.service.js';
import { env } from '../../../config/env.js';
import { refreshCookie } from '../middlewares/api-browser.middleware.js';
import { created, noContent, ok } from '../../../common/utils/api-response.js';

const cookieOptions = { httpOnly: true, secure: env.secureCookie, sameSite: 'lax', path: '/api/v1/auth' };
function sendTokens(res, tokens, user = null, isNew = false) {
  res.set('Cache-Control', 'no-store');
  res.cookie('academy.refresh', tokens.refreshToken, { ...cookieOptions, expires: new Date(tokens.refreshExpiresAt) });
  const data = { accessToken: tokens.accessToken, tokenType: tokens.tokenType, expiresIn: tokens.expiresIn, csrfToken: tokenService.csrfToken(tokens.refreshToken) };
  if (user) data.user = userDto(user);
  return (isNew ? created : ok)(res, data);
}
export function csrfToken(req, res) {
  res.set('Cache-Control', 'no-store');
  return ok(res, { csrfToken: tokenService.csrfToken(refreshCookie(req)) });
}
export const me = (req, res) => { res.set('Cache-Control', 'no-store'); return ok(res, userDto(req.user)); };
export async function login(req, res, next) {
  try {
    const user = await authService.authenticate(req.body);
    return sendTokens(res, await tokenService.issue(user.id), user);
  } catch (error) { return next(error); }
}
export async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    return sendTokens(res, await tokenService.issue(user.id), user, true);
  } catch (error) { return next(error); }
}
export async function refresh(req, res, next) {
  try { return sendTokens(res, await tokenService.refresh(refreshCookie(req))); }
  catch (error) { return next(error); }
}
export async function logout(req, res, next) {
  try {
    await tokenService.logout(req.authSessionId);
    res.clearCookie('academy.refresh', cookieOptions);
    return noContent(res);
  } catch (error) { return next(error); }
}
export async function usernameAvailable(req, res, next) {
  try { return ok(res, { available: await authService.isUsernameAvailable(req.query.username) }); }
  catch (error) { return next(error); }
}
