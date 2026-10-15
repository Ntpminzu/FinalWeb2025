import { Link } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { ResourceState, Empty } from '../../components/Feedback.jsx';
import Stats from '../../components/Stats.jsx';

export default function AdminDashboardPage() {
  const resource = useResource('/admin/dashboard');
  return (
    <section>
      <h1>Tổng quan quản trị</h1>
      <ResourceState resource={resource}>
        {resource.data && (
          <>
            <Stats
              items={[
                ['Khóa học', resource.data.stats.totalCourses],
                ['Học viên', resource.data.stats.totalStudents],
                ['Giảng viên', resource.data.stats.totalInstructors],
                ['Danh mục', resource.data.stats.totalCategories],
              ]}
            />
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card card-body h-100">
                  <h2 className="h4">Danh mục nhiều khóa học</h2>
                  {resource.data.topCategories.length ? (
                    resource.data.topCategories.map((category) => (
                      <div className="mb-3" key={category.name}>
                        <div className="d-flex justify-content-between">
                          <span>{category.name}</span>
                          <strong>{category.count}</strong>
                        </div>
                        <progress
                          className="w-100"
                          value={Number(category.count)}
                          max={Math.max(
                            ...resource.data.topCategories.map((item) => Number(item.count)),
                            1,
                          )}
                        />
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card card-body h-100">
                  <h2 className="h4">Hoạt động</h2>
                  <p>
                    Khóa học đang mở: <strong>{resource.data.courseStatuses.Published}</strong>
                  </p>
                  <p>
                    Khóa học đã khóa: <strong>{resource.data.courseStatuses.Disabled}</strong>
                  </p>
                  <p>
                    Học viên mới tháng này:{' '}
                    <strong>{resource.data.stats.newStudentsThisMonth}</strong>
                  </p>
                  <p>
                    Giảng viên mới tháng này:{' '}
                    <strong>{resource.data.stats.newInstructorsThisMonth}</strong>
                  </p>
                  <Link to="/admin/users">Quản lý người dùng →</Link>
                </div>
              </div>
            </div>
          </>
        )}
      </ResourceState>
    </section>
  );
}
