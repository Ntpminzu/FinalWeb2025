import { useState } from 'react';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { useCategories } from '../../app/providers.jsx';
import { ResourceState, ErrorMessage, Empty } from '../../components/Feedback.jsx';

export default function AdminCategoriesPage() {
  const resource = useResource('/admin/categories');
  const categories = useCategories();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const body = { name: new FormData(form).get('name') };
    setBusy(true);
    setError(null);
    try {
      await api.request(`/admin/categories${editing ? `/${editing.id}` : ''}`, {
        method: editing ? 'PATCH' : 'POST',
        body,
      });
      setEditing(null);
      form.reset();
      resource.reload();
      categories.reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  async function remove(category) {
    if (!window.confirm(`Xóa danh mục “${category.name}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api.request(`/admin/categories/${category.id}`, { method: 'DELETE' });
      if (editing?.id === category.id) setEditing(null);
      resource.reload();
      categories.reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>Quản lý danh mục</h1>
      <ErrorMessage error={error} />
      <form className="card card-body mb-4" key={editing?.id || 'new'} onSubmit={submit}>
        <h2 className="h5">{editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
        <div className="d-flex gap-2 flex-wrap align-items-end">
          <div className="flex-grow-1">
            <label className="form-label" htmlFor="category-name">
              Tên danh mục
            </label>
            <input
              id="category-name"
              className="form-control"
              name="name"
              required
              maxLength={100}
              defaultValue={editing?.name || ''}
            />
          </div>
          <button className="btn btn-primary" disabled={busy}>
            Lưu danh mục
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Hủy sửa
            </button>
          )}
        </div>
      </form>
      <ResourceState resource={resource}>
        {!resource.data?.length ? (
          <Empty />
        ) : (
          <div className="card table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th>Số khóa học</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.data.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.courseCount}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          disabled={busy}
                          onClick={() => setEditing(category)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={busy}
                          onClick={() => remove(category)}
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
