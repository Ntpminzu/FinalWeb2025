import { Link, useParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { ResourceState, Empty } from '../../components/Feedback.jsx';
import { duration } from '../../lib/format.js';

export default function CourseLearningPage() {
  const { courseId } = useParams();
  const resource = useResource(`/me/courses/${courseId}/progress`);
  return (
    <section>
      <div className="section-heading">
        <h1>Bài học của khóa học</h1>
        <Link to={`/student/course/${courseId}/feedback`}>Đánh giá khóa học</Link>
      </div>
      <ResourceState resource={resource}>
        {resource.data && (
          <>
            <p>Hoàn thành {resource.data.completion.percent}% khóa học</p>
            {!resource.data.lectures.length ? (
              <Empty>Giảng viên chưa thêm bài giảng.</Empty>
            ) : (
              <div className="list-group">
                {resource.data.lectures.map((lecture) => {
                  const progress = resource.data.progress.find(
                    (item) => item.lectureId === lecture.id,
                  );
                  return (
                    <Link
                      className="list-group-item list-group-item-action d-flex justify-content-between gap-3 p-3"
                      key={lecture.id}
                      to={`/student/courses/${courseId}/${lecture.id}`}
                    >
                      <span>
                        {lecture.orderIndex}. {lecture.title}
                      </span>
                      <span>
                        {progress?.isCompleted
                          ? '✓ Đã hoàn thành'
                          : `${Math.round(progress?.watchedPercent || 0)}%`}{' '}
                        ·{' '}
                        {lecture.durationSec == null
                          ? 'Chưa có thời lượng'
                          : duration(lecture.durationSec)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </ResourceState>
    </section>
  );
}
