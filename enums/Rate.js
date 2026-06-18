/**
 * «enum» Rate — Class Diagram
 *
 * Định nghĩa các mức đánh giá khóa học (số sao).
 *   1 = 1 sao
 *   2 = 2 sao
 *   3 = 3 sao
 *   4 = 4 sao
 *   5 = 5 sao
 *
 * Sử dụng: import Rate from '../enums/Rate.js';
 *
 * Liên quan:
 *   - UC [11] Review Course — Actor chọn số sao từ 1–5
 *   - Class Feedback.rating: Rate
 */
const Rate = Object.freeze({
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
});

/** Kiểm tra giá trị rating hợp lệ */
export function isValidRate(value) {
  const v = Number(value);
  return Number.isInteger(v) && v >= Rate.ONE && v <= Rate.FIVE;
}

export default Rate;
