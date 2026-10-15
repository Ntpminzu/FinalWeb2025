import { ValidationError } from '../../../common/errors/app-error.js';
import { positiveInteger } from '../../../common/schemas/common.schema.js';

export function lectureSchema(input) {
  const title = String(input?.title || '').trim();
  if (!title || title.length > 200) throw new ValidationError('Tiêu đề bài giảng không hợp lệ.');
  let url;
  try { url = new URL(String(input?.video_url || '')); } catch { throw new ValidationError('Link video không hợp lệ.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new ValidationError('Link video không hợp lệ.');
  const duration = input?.duration_sec ?? input?.durationSec;
  if (duration !== undefined && duration !== null && duration !== '') {
    const parsed = Number(duration);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 43200) throw new ValidationError('Thời lượng phải từ 1 đến 43200 giây.');
    return { title, video_url: url.toString(), duration_sec: parsed };
  }
  return { title, video_url: url.toString() };
}

export function progressSchema(input) {
  const lectureId = positiveInteger(input?.lecture_id ?? input?.lectureId, 'Bài giảng');
  const lastSecond = Number(input?.last_second ?? input?.lastSecond);
  if (!Number.isFinite(lastSecond) || lastSecond < 0) throw new ValidationError('Dữ liệu tiến độ không hợp lệ.');
  return { lectureId, lastSecond };
}

export function durationSchema(input) {
  const lectureId = positiveInteger(input?.lecture_id, 'Bài giảng');
  const duration = Number(input?.duration_sec);
  if (!Number.isFinite(duration) || duration < 1 || duration > 43200) throw new ValidationError('Thời lượng bài giảng không hợp lệ.');
  return { lectureId, duration: Math.floor(duration) };
}

export function lectureApiInput(input = {}) {
  const durationSec = positiveInteger(input.durationSec, 'Thời lượng');
  if (durationSec > 43200) throw new ValidationError('Thời lượng vượt quá 12 giờ.');
  return { title: input.title, video_url: input.videoUrl, duration_sec: durationSec };
}
