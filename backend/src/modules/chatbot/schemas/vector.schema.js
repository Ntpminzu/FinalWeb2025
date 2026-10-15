import { AppError } from '../../../common/errors/app-error.js';

export function vectorLiteral(vector) {
  if (!Array.isArray(vector) || vector.length !== 1024 || vector.some(value => !Number.isFinite(value)) ||
      !vector.some(value => value !== 0))
    throw new AppError('Embedding phải có 1024 giá trị hữu hạn và khác vector 0. Kiểm tra embedding model.', 503, 'CHATBOT_VECTOR_INVALID');
  return JSON.stringify(vector);
}
