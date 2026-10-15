import { Link, useLocation } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { ResourceState } from '../../components/Feedback.jsx';
import { CourseGrid } from '../courses/CourseCard.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

export default function MyCoursesPage({ overview = false }) {
  const resource = useResource('/me/courses');
  const { user } = useAuth();
  const location = useLocation();
  return (
    <section>
      {overview && <p className="section-kicker">Xin chào, {user.name}</p>}
      <h1>{overview ? 'Góc học tập của bạn' : 'Khóa học của tôi'}</h1>
      {location.state?.purchased && (
        <p role="status" className="alert alert-success">
          Đã mua {location.state.purchased} khóa học thành công.
        </p>
      )}
      <ResourceState resource={resource}>
        <CourseGrid courses={resource.data} purchasable={false}>
          {(course) => (
            <>
              <div
                className="progress mt-3"
                role="progressbar"
                aria-valuenow={course.completionPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Tiến độ khóa học"
              >
                <div className="progress-bar" style={{ width: `${course.completionPercent}%` }} />
              </div>
              <small className="text-secondary">
                Hoàn thành {Math.round(course.completionPercent)}%
              </small>
              <Link
                className="btn btn-primary w-100 mt-2"
                to={`/student/courses/${course.courseId}`}
              >
                Vào học
              </Link>
              <Link
                className="btn btn-outline-primary w-100 mt-2"
                to={`/student/course/${course.courseId}/feedback`}
              >
                Đánh giá khóa học
              </Link>
            </>
          )}
        </CourseGrid>
      </ResourceState>
    </section>
  );
}
