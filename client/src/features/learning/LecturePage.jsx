import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { api } from '../../lib/http.js';
import { useResource } from '../../lib/useResource.js';
import { duration } from '../../lib/format.js';
import { ResourceState, ErrorMessage } from '../../components/Feedback.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';

function LessonPlayer({ data }) {
  const video = useRef(null);
  const { user } = useAuth();
  const [progress, setProgress] = useState(data.progress);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const element = video.current;
    const player = new Plyr(element, { iconUrl: '/imgs/plyr.svg', storage: { enabled: false } });
    let active = true;
    let acknowledged = data.progress.lastSecond;
    let pending = null;
    let running = false;
    async function flush() {
      if (running || pending === null) return;
      running = true;
      while (pending !== null) {
        if (api.getSession().user?.id !== user.id) {
          pending = null;
          break;
        }
        const second = pending;
        pending = null;
        try {
          const { data: next } = await api.request(`/me/lectures/${data.current.id}/progress`, {
            method: 'PATCH',
            body: { lastSecond: second },
            keepalive: true,
          });
          acknowledged = Math.max(acknowledged, next.lastSecond);
          if (active) {
            setProgress(next);
            setError(null);
            setSaved(true);
          }
        } catch (error) {
          if (active) {
            setError(error);
            setSaved(false);
          }
          pending = null;
        }
      }
      running = false;
    }
    function save(force = false) {
      if (data.current.durationSec == null || !Number.isFinite(element.currentTime)) return;
      const second = Math.max(0, Math.floor(element.currentTime));
      if (second <= acknowledged || (!force && second - acknowledged < 5)) return;
      pending = Math.max(pending || 0, second);
      flush();
    }
    const resume = () => {
      if (data.progress.lastSecond > 0 && Number.isFinite(element.duration))
        element.currentTime = Math.min(data.progress.lastSecond, Math.max(0, element.duration - 1));
      const measured = Math.floor(element.duration);
      if (data.current.durationSec != null && measured > 0)
        api
          .request(`/me/lectures/${data.current.id}/duration`, {
            method: 'PATCH',
            body: { durationSec: measured },
          })
          .catch((error) => {
            if (active) setError(error);
          });
    };
    const tick = () => save();
    const force = () => save(true);
    const visibility = () => {
      if (document.hidden) save(true);
    };
    const mediaError = () => {
      if (active)
        setError(new Error('Không tải được video. Kiểm tra đường dẫn video hoặc kết nối mạng.'));
    };
    element.addEventListener('loadedmetadata', resume);
    element.addEventListener('timeupdate', tick);
    element.addEventListener('pause', force);
    element.addEventListener('ended', force);
    element.addEventListener('error', mediaError);
    window.addEventListener('pagehide', force);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      save(true);
      active = false;
      element.removeEventListener('loadedmetadata', resume);
      element.removeEventListener('timeupdate', tick);
      element.removeEventListener('pause', force);
      element.removeEventListener('ended', force);
      element.removeEventListener('error', mediaError);
      window.removeEventListener('pagehide', force);
      document.removeEventListener('visibilitychange', visibility);
      player.destroy();
    };
  }, [data.current.id]);
  return (
    <>
      <h1 className="h4">{data.current.title}</h1>
      <span className={`badge mb-3 ${progress.isCompleted ? 'bg-success' : 'bg-secondary'}`}>
        {progress.isCompleted
          ? 'Đã hoàn thành'
          : `Đang học: ${Math.round(progress.watchedPercent)}%`}
      </span>
      <video
        ref={video}
        src={data.current.videoUrl}
        controls
        playsInline
        preload="metadata"
        className="w-100"
      />
      {data.current.durationSec == null && (
        <p className="alert alert-warning mt-3">
          Bài giảng chưa có thời lượng chuẩn. Giảng viên cần cập nhật trước khi lưu tiến độ.
        </p>
      )}
      <p className="small text-secondary mt-2" role="status">
        {saved
          ? `Đã lưu tại ${duration(progress.lastSecond)}`
          : 'Tiến độ được lưu khi xem, tạm dừng và chuyển bài.'}
      </p>
      <ErrorMessage error={error} />
    </>
  );
}
export default function LecturePage() {
  const { courseId, lectureId } = useParams();
  const resource = useResource(`/me/courses/${courseId}/lectures/${lectureId}`);
  return (
    <ResourceState resource={resource}>
      {resource.data && (
        <>
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card card-body">
                <LessonPlayer key={lectureId} data={resource.data} />
              </div>
            </div>
            <aside className="col-lg-4">
              <div className="card">
                <h2 className="card-header h5">Danh sách bài học</h2>
                <div className="list-group list-group-flush">
                  {resource.data.lectures.map((lecture) => (
                    <Link
                      key={lecture.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between ${Number(lectureId) === lecture.id ? 'active' : ''}`}
                      to={`/student/courses/${courseId}/${lecture.id}`}
                    >
                      <span>
                        {lecture.orderIndex}. {lecture.title}
                      </span>
                      <small>{duration(lecture.durationSec)}</small>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
          <Link className="btn btn-link mt-3" to={`/student/courses/${courseId}`}>
            ← Quay lại danh sách bài học
          </Link>
        </>
      )}
    </ResourceState>
  );
}
