import * as userService from '../services/user.service.js';
import { ok, noContent } from '../../../common/utils/api-response.js';
import { userDto } from '../dto/user.dto.js';

export async function profile(req, res, next) {
  try {
    const data = await userService.updateProfile(req.user.id, { ...req.user, ...req.body });
    return ok(res, userDto({ ...req.user, ...data }));
  } catch (error) { return next(error); }
}

export async function password(req, res, next) {
  try { await userService.changePassword(req.user.id, req.body, true); return noContent(res); }
  catch (error) { return next(error); }
}
