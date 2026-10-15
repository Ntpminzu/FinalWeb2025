import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { ValidationError } from '../errors/app-error.js';
import { uploadsDirectory } from '../../config/paths.js';

const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const uploadDirectory = path.join(uploadsDirectory(), 'thumbnails');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
    callback(null, uploadDirectory);
  },
  filename(req, file, callback) {
    callback(null, `${crypto.randomUUID()}${extensions[file.mimetype]}`);
  },
});

export const thumbnailUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20 },
  fileFilter(req, file, callback) {
    const allowed = Object.hasOwn(extensions, file.mimetype);
    callback(allowed ? null : new multer.MulterError('LIMIT_UNEXPECTED_FILE'), allowed);
  },
});

export function removeUploadedFile(file) {
  return file?.path ? fs.promises.unlink(file.path).catch(() => {}) : Promise.resolve();
}

export async function validateThumbnail(file) {
  if (!file) return;
  const handle = await fs.promises.open(file.path, 'r');
  const header = Buffer.alloc(12);
  try { await handle.read(header, 0, 12, 0); }
  finally { await handle.close(); }
  const valid = file.mimetype === 'image/png' ? header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : file.mimetype === 'image/jpeg' ? header[0] === 255 && header[1] === 216 && header[2] === 255
    : header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) throw new ValidationError('Nội dung ảnh không khớp với loại tệp.');
}
