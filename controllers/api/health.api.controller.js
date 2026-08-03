import { ok } from '../../utils/api-response.js';

export function health(req, res) {
  return ok(res, {
    status: 'consong nhe',
    service: 'online-academy',
    timestamp: new Date().toISOString(),
  });
}
