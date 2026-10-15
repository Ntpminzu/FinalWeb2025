import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { useCategories } from '../../app/providers.jsx';
import { ResourceState, ErrorMessage } from '../../components/Feedback.jsx';
import DescriptionEditor from './DescriptionEditor.jsx';

function CourseForm({ course, onSaved }) {
  const categories = useCategories();
  const [description, setDescription] = useState(course?.fullDescription || '');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function pick(event) {
    const file = event.target.files[0];
    setError(null);
    if (
      file &&
      (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024)
    ) {
      event.target.value = '';
      setError(new Error('Chọn ảnh JPEG/PNG/WebP tối đa 5 MiB.'));
      setPreview(null);
      return;
    }
    setPreview(file ? URL.createObjectURL(file) : null);
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const body = new FormData(event.currentTarget);
    body.set('fullDescription', description);
    if (!body.get('thumbnail')?.size) body.delete('thumbnail');
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.request(`/instructor/courses${course ? `/${course.id}` : ''}`, {
        method: course ? 'PATCH' : 'POST',
        body,
      });
      onSaved(data);
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="card card-body p-4" onSubmit={submit}>
      <ErrorMessage error={error || categories.error} />
      <div className="mb-3">
        <label className="form-label" htmlFor="course-title">
          Tên khóa học
        </label>
        <input
          id="course-title"
          className="form-control"
          name="title"
          defaultValue={course?.title || ''}
          required
          maxLength={200}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="course-category">
          Danh mục
        </label>
        <select
          id="course-category"
          className="form-select"
          name="categoryId"
          defaultValue={course?.categoryId || ''}
          required
        >
          <option value="">Chọn danh mục</option>
          {categories.flat.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="short-description">
          Mô tả ngắn
        </label>
        <textarea
          id="short-description"
          className="form-control"
          rows={3}
          name="shortDescription"
          defaultValue={course?.shortDescription || ''}
        />
      </div>
      <label className="form-label">Mô tả chi tiết</label>
      <DescriptionEditor initialValue={course?.fullDescription || ''} onChange={setDescription} />
      <p className="form-text">Nội dung được lưu dưới dạng văn bản như phiên bản hiện tại.</p>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor="course-price">
            Giá (VND)
          </label>
          <input
            id="course-price"
            className="form-control"
            type="number"
            name="price"
            min={0}
            step="any"
            defaultValue={course?.price ?? 0}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor="sale-price">
            Giá khuyến mãi (không bắt buộc)
          </label>
          <input
            id="sale-price"
            className="form-control"
            type="number"
            name="salePrice"
            min={0}
            step="any"
            defaultValue={course?.salePrice ?? ''}
          />
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="thumbnail">
          Ảnh thumbnail
        </label>
        <input
          id="thumbnail"
          className="form-control"
          type="file"
          name="thumbnail"
          accept="image/jpeg,image/png,image/webp"
          onChange={pick}
        />
        {(preview || course?.thumbnail) && (
          <img
            className="thumbnail-preview mt-3 rounded"
            src={preview || course.thumbnail}
            alt="Ảnh xem trước"
          />
        )}
      </div>
      <button
        className="btn btn-primary"
        disabled={busy || categories.loading || !!categories.error}
      >
        {busy ? 'Đang lưu...' : 'Lưu khóa học'}
      </button>
    </form>
  );
}
export default function CourseEditorPage() {
  const { courseId } = useParams();
  const resource = useResource(`/instructor/courses/${courseId}`, { enabled: !!courseId });
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  function saved(course) {
    if (!courseId) navigate(`/instructor/edit/course/${course.id}`, { replace: true });
    else {
      setMessage('Đã lưu khóa học.');
      resource.reload();
    }
  }
  return (
    <section className="narrow-page">
      <div className="section-heading">
        <h1>{courseId ? 'Sửa khóa học' : 'Tạo khóa học'}</h1>
        <Link to="/instructor/courses">Danh sách khóa học</Link>
      </div>
      {message && (
        <p className="alert alert-success" role="status">
          {message}
        </p>
      )}
      {courseId ? (
        <ResourceState resource={resource}>
          {resource.data && (
            <CourseForm key={resource.data.id} course={resource.data} onSaved={saved} />
          )}
        </ResourceState>
      ) : (
        <CourseForm onSaved={saved} />
      )}
    </section>
  );
}
