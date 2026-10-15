import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { ResourceState, ErrorMessage } from '../../components/Feedback.jsx';

function ReviewForm({ context, courseId, reload }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.rating = Number(body.rating);
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      await api.request(`/courses/${courseId}/reviews${context.review ? '/me' : ''}`, {
        method: context.review ? 'PATCH' : 'POST',
        body,
      });
      setMessage('Đã lưu đánh giá.');
      reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ErrorMessage error={error} />
      {message && (
        <p role="status" className="alert alert-success">
          {message}
        </p>
      )}
      {!context.canReview && !context.review ? (
        <p className="alert alert-info">
          Bạn cần hoàn thành ít nhất một bài giảng trước khi đánh giá.
        </p>
      ) : (
        <form className="card card-body" onSubmit={submit}>
          <label className="form-label" htmlFor="rating">
            Số sao
          </label>
          <select
            id="rating"
            name="rating"
            className="form-select mb-3"
            defaultValue={context.review?.rating || 5}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} sao
              </option>
            ))}
          </select>
          <label className="form-label" htmlFor="comment">
            Nhận xét
          </label>
          <textarea
            id="comment"
            name="comment"
            className="form-control mb-3"
            rows={5}
            maxLength={5000}
            defaultValue={context.review?.comment || ''}
          />
          <button className="btn btn-primary" disabled={busy}>
            {context.review ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
          </button>
        </form>
      )}
    </>
  );
}
export default function ReviewPage() {
  const { courseId } = useParams();
  const resource = useResource(`/courses/${courseId}/reviews/me`);
  return (
    <section className="narrow-page">
      <h1>Đánh giá khóa học</h1>
      <ResourceState resource={resource}>
        {resource.data && (
          <ReviewForm context={resource.data} courseId={courseId} reload={resource.reload} />
        )}
      </ResourceState>
      <Link className="btn btn-link mt-3" to={`/student/courses/${courseId}`}>
        ← Quay lại khóa học
      </Link>
    </section>
  );
}
