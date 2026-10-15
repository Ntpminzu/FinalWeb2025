import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { duration } from '../../lib/format.js';
import { ResourceState, ErrorMessage, Empty } from '../../components/Feedback.jsx';

export default function LectureManagerPage() {
  const { courseId } = useParams();
  const resource = useResource(`/instructor/courses/${courseId}/lectures`);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.durationSec = Number(body.durationSec);
    const form = event.currentTarget;
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      await api.request(
        editing ? `/instructor/lectures/${editing.id}` : `/instructor/courses/${courseId}/lectures`,
        { method: editing ? 'PATCH' : 'POST', body },
      );
      setEditing(null);
      form.reset();
      resource.reload();
      setMessage('Đã lưu bài giảng.');
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  async function remove(lecture) {
    if (!window.confirm(`Xóa bài giảng “${lecture.title}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api.request(`/instructor/lectures/${lecture.id}`, { method: 'DELETE' });
      if (editing?.id === lecture.id) setEditing(null);
      resource.reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <div className="section-heading">
        <h1>Quản lý bài giảng</h1>
        <Link to={`/instructor/edit/course/${courseId}`}>Sửa khóa học</Link>
      </div>
      <ErrorMessage error={error} />
      {message && (
        <p role="status" className="alert alert-success">
          {message}
        </p>
      )}
      <ResourceState resource={resource}>
        <form className="card card-body mb-4" key={editing?.id || 'new'} onSubmit={submit}>
          <h2 className="h4">{editing ? 'Sửa bài giảng' : 'Thêm bài giảng'}</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="lecture-title">
                Tên bài giảng
              </label>
              <input
                id="lecture-title"
                name="title"
                className="form-control"
                defaultValue={editing?.title || ''}
                required
                maxLength={200}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label" htmlFor="video-url">
                URL video
              </label>
              <input
                id="video-url"
                name="videoUrl"
                type="url"
                className="form-control"
                defaultValue={editing?.videoUrl || ''}
                placeholder="https://..."
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="lecture-duration">
                Thời lượng (giây)
              </label>
              <input
                id="lecture-duration"
                name="durationSec"
                type="number"
                min={1}
                max={43200}
                step={1}
                className="form-control"
                defaultValue={editing?.durationSec ?? ''}
                required
              />
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary" disabled={busy}>
              Lưu bài giảng
            </button>
            {editing && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Hủy sửa
              </button>
            )}
          </div>
        </form>
        {!resource.data?.length ? (
          <Empty>Chưa có bài giảng.</Empty>
        ) : (
          <div className="card table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Thứ tự</th>
                  <th>Bài giảng</th>
                  <th>Thời lượng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.data.map((lecture) => (
                  <tr key={lecture.id}>
                    <td>{lecture.orderIndex}</td>
                    <td>{lecture.title}</td>
                    <td>{duration(lecture.durationSec)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          disabled={busy}
                          onClick={() => {
                            setEditing(lecture);
                            setMessage('');
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={busy}
                          onClick={() => remove(lecture)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ResourceState>
    </section>
  );
}
