import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { money } from '../../lib/format.js';
import { useCategories } from '../../app/providers.jsx';
import { ResourceState, ErrorMessage, Empty } from '../../components/Feedback.jsx';
import Pagination from '../../components/Pagination.jsx';
import ManagementFilters from '../../components/ManagementFilters.jsx';

export default function AdminCoursesPage() {
  const [params] = useSearchParams();
  const resource = useResource(`/admin/courses?${params}`);
  const { flat } = useCategories();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function mutate(course, remove = false) {
    if (
      !window.confirm(
        `${remove ? 'Xóa' : course.isDisabled ? 'Mở khóa' : 'Khóa'} khóa học “${course.title}”?`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await api.request(`/admin/courses/${course.id}${remove ? '' : '/status'}`, {
        method: remove ? 'DELETE' : 'PATCH',
        body: remove ? undefined : { isDisabled: !course.isDisabled },
      });
      resource.reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>Quản lý khóa học</h1>
      <ManagementFilters categories={flat} />
      <ErrorMessage error={error} />
      <ResourceState resource={resource}>
        {!resource.data?.length ? (
          <Empty>Không có khóa học phù hợp.</Empty>
        ) : (
          <div className="card table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Giảng viên</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.data.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <strong>{course.title}</strong>
                    </td>
                    <td>{course.instructorName}</td>
                    <td>{money(course.salePrice ?? course.price)}</td>
                    <td>{course.isDisabled ? 'Đã khóa' : 'Đang hoạt động'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-warning btn-sm"
                          disabled={busy}
                          onClick={() => mutate(course)}
                        >
                          {course.isDisabled ? 'Mở khóa' : 'Khóa'}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={busy}
                          onClick={() => mutate(course, true)}
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
        <Pagination pagination={resource.result?.pagination} />
      </ResourceState>
    </section>
  );
}
