import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { date } from '../../lib/format.js';
import { ResourceState, ErrorMessage, Empty } from '../../components/Feedback.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useCart } from '../cart/CartProvider.jsx';
import { Price } from './CourseCard.jsx';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const resource = useResource(`/courses/${courseId}`, { auth: false });
  const { user, ready } = useAuth();
  const cart = useCart();
  const owned = useResource('/me/courses', { enabled: user?.role === 'student' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const isOwned = owned.data?.some((course) => Number(course.courseId) === Number(courseId));
  const inCart = cart.courses.some((course) => Number(course.id) === Number(courseId));
  async function watchlist() {
    setSaving(true);
    setError(null);
    try {
      await api.request('/me/watchlist/items', {
        method: 'POST',
        body: { courseId: Number(courseId) },
      });
      setMessage('Đã lưu vào danh sách yêu thích.');
    } catch (error) {
      setError(error);
    } finally {
      setSaving(false);
    }
  }
  async function add() {
    setError(null);
    try {
      await cart.add(Number(courseId));
      setMessage('Đã thêm vào giỏ hàng.');
    } catch (error) {
      setError(error);
    }
  }
  return (
    <ResourceState resource={resource}>
      {resource.data && (
        <div className="py-3">
          <Link to="/courses" className="small">
            ← Tất cả khóa học
          </Link>
          <div className="row g-4 mt-1">
            <div className="col-lg-8">
              <div className="card card-body p-4">
                <h1>{resource.data.title}</h1>
                <p className="lead">{resource.data.shortDescription}</p>
                <p>
                  Giảng viên: <strong>{resource.data.instructorName || 'Đang cập nhật'}</strong>
                </p>
                <p>
                  <i className="bi bi-star-fill text-warning" aria-hidden="true" />{' '}
                  {resource.data.ratingAverage.toFixed(1)} · {resource.data.ratingCount} đánh giá ·
                  Cập nhật {date(resource.data.updatedAt)}
                </p>
                <h2 className="h4 mt-3">Nội dung khóa học</h2>
                <p className="preserve-lines">
                  {resource.data.fullDescription || 'Đang cập nhật nội dung.'}
                </p>
                {resource.data.instructorBio && (
                  <>
                    <h2 className="h4 mt-3">Về giảng viên</h2>
                    <p className="preserve-lines">{resource.data.instructorBio}</p>
                    <p>{resource.data.instructorSpecialization}</p>
                  </>
                )}
              </div>
            </div>
            <aside className="col-lg-4">
              <div className="card course-card">
                <img
                  className="card-img-top"
                  src={resource.data.thumbnail || '/imgs/course-placeholder.svg'}
                  alt=""
                />
                <div className="card-body">
                  <div className="fs-4 mb-3">
                    <Price course={resource.data} />
                  </div>
                  {isOwned ? (
                    <Link className="btn btn-success w-100" to={`/student/courses/${courseId}`}>
                      Vào học
                    </Link>
                  ) : (
                    (!user || user.role === 'student') && (
                      <button
                        className="btn btn-primary w-100"
                        disabled={
                          !ready ||
                          cart.loading ||
                          cart.busy ||
                          inCart ||
                          (user?.role === 'student' && owned.loading)
                        }
                        onClick={add}
                      >
                        {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
                      </button>
                    )
                  )}
                  {user?.role === 'student' ? (
                    <button
                      className="btn btn-outline-primary w-100 mt-2"
                      disabled={saving}
                      onClick={watchlist}
                    >
                      Lưu yêu thích
                    </button>
                  ) : (
                    !user && (
                      <Link
                        className="btn btn-outline-primary w-100 mt-2"
                        to={`/account/signin?returnTo=/courses/${courseId}`}
                      >
                        Đăng nhập để lưu yêu thích
                      </Link>
                    )
                  )}
                  <ErrorMessage error={error} />
                  {message && (
                    <p role="status" className="text-success mt-2">
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
          <section className="card card-body mt-4">
            <h2 className="h4">Đánh giá từ học viên</h2>
            {resource.data.feedbacks.length ? (
              resource.data.feedbacks.map((feedback, index) => (
                <article className="border-bottom py-3" key={index}>
                  <strong>{feedback.studentName || 'Học viên'}</strong>
                  <span className="text-warning ms-2">{feedback.rating}/5 ★</span>
                  <p className="preserve-lines mb-1">{feedback.comment}</p>
                  <small className="text-secondary">{date(feedback.createdAt)}</small>
                </article>
              ))
            ) : (
              <Empty>Chưa có đánh giá.</Empty>
            )}
          </section>
        </div>
      )}
    </ResourceState>
  );
}
