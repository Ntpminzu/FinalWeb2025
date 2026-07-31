import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const uploadDirectory = path.join(process.cwd(), 'uploads', 'thumbnails');

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
