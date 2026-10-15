import { useState } from 'react';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { ResourceState, ErrorMessage } from '../../components/Feedback.jsx';
import ProfilePage from '../users/ProfilePage.jsx';
import Stats from '../../components/Stats.jsx';

export default function InstructorProfilePage() {
  const resource = useResource('/instructor/profile');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      await api.request('/instructor/profile', { method: 'PATCH', body });
      resource.reload();
      setMessage('Đã lưu thông tin giảng viên.');
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ProfilePage />
      <section className="mt-5">
        <h2>Hồ sơ giảng viên</h2>
        <ErrorMessage error={error} />
        {message && (
          <p role="status" className="alert alert-success">
            {message}
          </p>
        )}
        <ResourceState resource={resource}>
          {resource.data && (
            <>
              <Stats
                items={[
                  ['Khóa học', resource.data.totalCourses],
                  ['Học viên', resource.data.totalStudents],
                  ['Đánh giá', resource.data.ratingAverage.toFixed(1)],
                ]}
              />
              <form className="card card-body" onSubmit={submit}>
                <label className="form-label" htmlFor="specialization">
                  Chuyên môn
                </label>
                <input
                  id="specialization"
                  className="form-control mb-3"
                  name="specialization"
                  maxLength={200}
                  defaultValue={resource.data.specialization || ''}
                />
                <label className="form-label" htmlFor="bio">
                  Giới thiệu
                </label>
                <textarea
                  id="bio"
                  className="form-control mb-3"
                  name="bio"
                  rows={5}
                  maxLength={5000}
                  defaultValue={resource.data.bio || ''}
                />
                <button className="btn btn-primary" disabled={busy}>
                  Lưu thông tin giảng viên
                </button>
              </form>
            </>
          )}
        </ResourceState>
      </section>
    </>
  );
}
