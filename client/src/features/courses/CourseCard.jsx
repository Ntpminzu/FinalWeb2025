import { useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../cart/CartProvider.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { money } from '../../lib/format.js';
import { Empty, ErrorMessage } from '../../components/Feedback.jsx';

export function Price({ course }) {
  return (
    <span className="price-block">
      <strong>{money(course.salePrice ?? course.price)}</strong>
      {course.salePrice != null && Number(course.salePrice) !== Number(course.price) && (
        <del className="text-secondary small ms-2">{money(course.price)}</del>
      )}
    </span>
  );
}
export default function CourseCard({ course, children, purchasable = true }) {
  const cart = useCart();
  const { user, ready } = useAuth();
  const [error, setError] = useState(null);
  const id = course.id ?? course.courseId;
  const added = cart.courses.some((item) => item.id === id);
  async function add() {
    setError(null);
    try {
      await cart.add(id);
    } catch (error) {
      setError(error);
    }
  }
  return (
    <article className="card course-card h-100">
      <Link to={`/courses/${id}`} tabIndex={-1} aria-hidden="true">
        <img
          className="card-img-top"
          src={course.thumbnail || '/imgs/course-placeholder.svg'}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/imgs/course-placeholder.svg';
          }}
        />
      </Link>
      <div className="card-body d-flex flex-column">
        <h2 className="h5 card-title">
          <Link className="text-decoration-none text-reset" to={`/courses/${id}`}>
            {course.title}
          </Link>
        </h2>
        {course.instructorName && (
          <p className="small text-secondary mb-2">{course.instructorName}</p>
        )}
        <p className="small text-secondary course-summary">{course.shortDescription}</p>
        {course.ratingAverage != null && (
          <p className="small mb-2">
            <i className="bi bi-star-fill text-warning" aria-hidden="true" />{' '}
            {Number(course.ratingAverage).toFixed(1)}{' '}
            <span className="text-secondary">({course.ratingCount || 0} đánh giá)</span>
          </p>
        )}
        <div className="mt-auto">
          <Price course={course} />
          {purchasable && (!user || user.role === 'student') && (
            <button
              className="btn btn-primary w-100 mt-3"
              disabled={!ready || cart.loading || cart.busy || added}
              onClick={add}
            >
              {added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
            </button>
          )}
          {children}
          <ErrorMessage error={error} />
        </div>
      </div>
    </article>
  );
}
export function CourseGrid({ courses = [], children, purchasable = true }) {
  if (!courses.length) return <Empty>Chưa có khóa học phù hợp.</Empty>;
  return (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-4">
      {courses.map((course) => (
        <div className="col" key={course.id ?? course.courseId}>
          <CourseCard course={course} purchasable={purchasable}>
            {children?.(course)}
          </CourseCard>
        </div>
      ))}
    </div>
  );
}
