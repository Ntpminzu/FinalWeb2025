import CourseDao from '../daos/course.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';
import ProgressDao from '../daos/progress.dao.js';
import FeedbackDao from '../daos/feedback.dao.js';

// ══════════════════════════════════════════
// UC [11] Review Course
// Class Diagram: Student.submitFeedback(cId, r, txt)
// ══════════════════════════════════════════

/**
 * Kiểm tra trạng thái đánh giá và hiển thị form.
 * UC [11] Main Flow: Kiểm tra quyền → hiển thị form.
 * Exception 3.1: Nếu đã đánh giá → hiển thị đánh giá cũ để chỉnh sửa.
 * Tương ứng checkReviewStatus(userId, courseId) và showExistingReview / showEmptyForm trong Sequence Diagram.
 */
export async function checkReviewStatus(req, res) {
  const user = req.session.authUser;
  const { courseId } = req.params;

  const course = await CourseDao.findById(courseId);
  if (!course) return res.status(404).render('404');

  // phải mua khoá (sử dụng PurchasedDao)
  const purchased = await PurchasedDao.findByUserAndCourse(user.id, courseId);

  // % hoàn thành
  const completion = await ProgressDao.courseCompletion(user.id, courseId);
  const canReview = purchased && completion.total > 0 && completion.done >= 1;

  const myFeedback = await FeedbackDao.findByUserCourse(user.id, courseId);

  return res.render('vwStudent/feedback', {
    course,
    completion,              
    canReview,
    myFeedback,             
    ok: req.query.ok === '1' 
  });
}

/**
 * Gửi đánh giá khóa học mới hoặc cập nhật đánh giá cũ.
 * UC [11] Main Flow Step 4-7 / Exception 3.1 Step 8-13: Actor chọn sao + nhận xét → lưu → cập nhật rating.
 * Tương ứng submitReview / updateReview trong Sequence Diagram.
 */
export async function submitReview(req, res) {
  const user = req.session.authUser;
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  // validate căn bản — Rate enum (1–5)
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).render('vwStudent/feedback', {
      course: await CourseDao.findById(courseId),
      canReview: true,
      myFeedback: null,
      completion: await ProgressDao.courseCompletion(user.id, courseId),
      error: 'Rating phải từ 1 đến 5 sao.',
    });
  }

  // kiểm tra quyền đánh giá (đã mua + đã học 1 bài)
  const purchased = await PurchasedDao.findByUserAndCourse(user.id, courseId);

  const completion = await ProgressDao.courseCompletion(user.id, courseId);
  const canReview = purchased && completion.total > 0 && completion.done >= 1;
  if (!canReview) return res.status(403).render('403');

  await FeedbackDao.upsert(user.id, courseId, r, (comment ?? '').trim());
  // Trigger DB sẽ tự cập nhật courses.rating_avg & rating_count
  return res.redirect(`/student/course/${courseId}/feedback?ok=1`);
}
