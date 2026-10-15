import { Link, useNavigate } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { ResourceState } from '../../components/Feedback.jsx';
import { CourseGrid } from '../courses/CourseCard.jsx';

export default function HomePage() {
  const resource = useResource('/home', { auth: false });
  const navigate = useNavigate();
  return (
    <div className="home-page py-4">
      <section className="hero-brand mb-4" aria-labelledby="home-title">
        <div className="hero-content">
          <span className="hero-kicker">Academy commerce platform</span>
          <h1 id="home-title">Online Academy</h1>
          <p className="hero-lead">
            Khám phá khóa học chất lượng, mua nhanh như một online shop và bắt đầu học ngay trong
            tài khoản của bạn.
          </p>
          <form
            className="hero-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(
                `/search?q=${encodeURIComponent(new FormData(event.currentTarget).get('q'))}`,
              );
            }}
          >
            <label className="visually-hidden" htmlFor="hero-search">
              Tìm khóa học
            </label>
            <i className="bi bi-search" aria-hidden="true" />
            <input
              id="hero-search"
              type="search"
              name="q"
              maxLength={200}
              placeholder="Tìm khóa học, kỹ năng, giảng viên..."
            />
            <button className="btn btn-primary">Tìm kiếm</button>
          </form>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" to="/courses">
              Khóa học
            </Link>
            <Link className="btn btn-outline-primary btn-lg" to="/account/signup">
              Tạo tài khoản
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-panel-header">
            <div>
              <span>Learning console</span>
              <strong>Dashboard</strong>
            </div>
            <i className="bi bi-bar-chart-line" aria-hidden="true" />
          </div>
          <div className="metric-grid">
            <div>
              <strong>{resource.data?.outstandingCourses.length || 0}</strong>
              <span>Nổi bật</span>
            </div>
            <div>
              <strong>{resource.data?.newestCourses.length || 0}</strong>
              <span>Mới nhất</span>
            </div>
            <div>
              <strong>{resource.data?.topCategories.length || 0}</strong>
              <span>Lĩnh vực nổi bật</span>
            </div>
          </div>
          <div className="learning-path">
            {['Chọn khóa học phù hợp', 'Mua và lưu vào thư viện', 'Theo dõi tiến độ học'].map(
              (text, index) => (
                <div key={text} className={`path-row ${index === 0 ? 'active' : ''}`}>
                  <span />
                  <p>{text}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
      <section className="quick-stats mb-4" aria-label="Điểm nổi bật">
        {[
          ['mortarboard', 'Học theo lộ trình', 'Bài giảng và tiến độ trong một nơi.'],
          ['bag-check', 'Mua khóa học nhanh', 'Giỏ hàng rõ ràng, giá khuyến mãi nổi bật.'],
          ['stars', 'Xếp hạng minh bạch', 'Rating và lượt đánh giá ngay trên card.'],
        ].map(([icon, title, text]) => (
          <div key={icon}>
            <i className={`bi bi-${icon}`} aria-hidden="true" />
            <strong>{title}</strong>
            <span>{text}</span>
          </div>
        ))}
      </section>
      <ResourceState resource={resource}>
        {resource.data && (
          <>
            {[
              ['outstandingCourses', 'Khóa học nổi bật'],
              ['mostViewedCourses', 'Được xem nhiều nhất'],
              ['newestCourses', 'Khóa học mới nhất'],
            ].map(([key, title]) => (
              <section className="content-section" key={key}>
                <div className="section-heading">
                  <h2>{title}</h2>
                  <Link className="section-link" to="/courses">
                    Xem tất cả →
                  </Link>
                </div>
                <CourseGrid courses={resource.data[key]} />
              </section>
            ))}
            <section>
              <div className="section-heading">
                <h2>Lĩnh vực được quan tâm</h2>
              </div>
              <div className="row g-3">
                {resource.data.topCategories.map((category) => (
                  <div className="col-md-4" key={category.id}>
                    <Link
                      to={`/categories/${category.id}`}
                      className="card card-body text-decoration-none"
                    >
                      <strong>{category.name}</strong>
                      <span>{category.enrollCount} lượt đăng ký tuần này</span>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </ResourceState>
    </div>
  );
}
