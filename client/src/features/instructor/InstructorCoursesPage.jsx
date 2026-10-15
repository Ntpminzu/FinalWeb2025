import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { money } from '../../lib/format.js';
import { useCategories } from '../../app/providers.jsx';
import { ResourceState, ErrorMessage, Empty } from '../../components/Feedback.jsx';
import Pagination from '../../components/Pagination.jsx';
import Stats from '../../components/Stats.jsx';
import ManagementFilters from '../../components/ManagementFilters.jsx';

export default function InstructorCoursesPage({ dashboard = false }) {
  const [params] = useSearchParams();
  const resource = useResource(
    dashboard ? '/instructor/dashboard' : `/instructor/courses?${params}`,
  );
  const { flat } = useCategories();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const courses = dashboard ? resource.data?.courses : resource.data;
  async function mutate(course, remove = false) {
    if (remove && !window.confirm(`Xóa khóa học “${course.title}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api.request(`/instructor/courses/${course.id}${remove ? '' : '/status'}`, {
        method: remove ? 'DELETE' : 'PATCH',
        body: remove ? undefined : { isCompleted: !course.isCompleted },
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
      <div className="section-heading">
        <h1>{dashboard ? 'Tổng quan giảng viên' : 'Quản lý khóa học'}</h1>
        <Link className="btn btn-primary" to="/instructor/new">
          Tạo khóa học
        </Link>
      </div>
      <ErrorMessage error={error} />
      {!dashboard && <ManagementFilters categories={flat} />}
      <ResourceState resource={resource}>
        {dashboard && courses && (
          <Stats
            items={[
              ['Khóa học', resource.data.totalCourses],
              ['Đã hoàn thành nội dung', courses.filter((course) => course.isCompleted).length],
              ['Lượt đăng ký', courses.reduce((sum, course) => sum + course.totalStudents, 0)],
              ['Đang khóa', courses.filter((course) => course.isDisabled).length],
            ]}
          />
        )}
        {!courses?.length ? (
          <Empty>Bạn chưa có khóa học.</Empty>
        ) : (
          <div className="card table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Giá</th>
                  <th>Nội dung</th>
                  <th>Học viên</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <strong>{course.title}</strong>
                      {course.isDisabled && (
                        <small className="d-block text-danger">Đã bị quản trị khóa</small>
                      )}
                    </td>
                    <td>{money(course.salePrice ?? course.price)}</td>
                    <td>{course.isCompleted ? 'Đã hoàn thành' : 'Đang soạn'}</td>
                    <td>{course.totalStudents}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <Link
                          className="btn btn-outline-primary btn-sm"
                          to={`/instructor/edit/course/${course.id}`}
                        >
                          Sửa
                        </Link>
                        <Link
                          className="btn btn-outline-primary btn-sm"
                          to={`/instructor/edit/lectures/${course.id}`}
                        >
                          Bài giảng
                        </Link>
                        <button
                          className="btn btn-outline-success btn-sm"
                          disabled={busy}
                          onClick={() => mutate(course)}
                        >
                          {course.isCompleted ? 'Đặt chưa hoàn thành' : 'Hoàn thành nội dung'}
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
        {!dashboard && <Pagination pagination={resource.result?.pagination} />}
      </ResourceState>
    </section>
  );
}
