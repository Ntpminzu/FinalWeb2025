import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from './CartProvider.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { money } from '../../lib/format.js';
import { Price } from '../courses/CourseCard.jsx';
import { Empty, ErrorMessage, Loading } from '../../components/Feedback.jsx';

export default function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  async function action(callback) {
    setError(null);
    try {
      await callback();
    } catch (error) {
      setError(error);
    }
  }
  if (user && user.role !== 'student') return <p>Giỏ hàng dành cho tài khoản học viên.</p>;
  return (
    <section className="py-3">
      <h1>Giỏ hàng</h1>
      <ErrorMessage error={error || cart.error} />
      {cart.error && (
        <button className="btn btn-outline-primary mb-3" onClick={cart.refresh}>
          Tải lại giỏ hàng
        </button>
      )}
      {cart.loading ? (
        <Loading />
      ) : !cart.courses.length ? (
        <Empty>
          Giỏ hàng đang trống. <Link to="/courses">Khám phá khóa học</Link>
        </Empty>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card">
              <ul className="list-group list-group-flush">
                {cart.courses.map((course) => (
                  <li
                    className="list-group-item p-3 d-flex gap-3 align-items-center"
                    key={course.id}
                  >
                    <img
                      className="cart-thumbnail rounded"
                      src={course.thumbnail || '/imgs/course-placeholder.svg'}
                      alt=""
                    />
                    <div className="flex-grow-1">
                      <Link className="fw-bold text-decoration-none" to={`/courses/${course.id}`}>
                        {course.title}
                      </Link>
                      <div>
                        <Price course={course} />
                      </div>
                    </div>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      disabled={cart.busy}
                      aria-label={`Xóa ${course.title} khỏi giỏ`}
                      onClick={() => action(() => cart.remove(course.id))}
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="btn btn-link text-danger mt-2"
              disabled={cart.busy}
              onClick={() => action(cart.clear)}
            >
              Xóa toàn bộ giỏ
            </button>
          </div>
          <aside className="col-lg-4">
            <div className="card card-body">
              <h2 className="h4">Tổng cộng</h2>
              <strong className="fs-3 mb-3">{money(cart.total)}</strong>
              {!user && (
                <p className="small text-secondary">Giá sẽ được kiểm tra lại sau khi đăng nhập.</p>
              )}
              {user ? (
                <button
                  className="btn btn-primary"
                  disabled={cart.busy || cart.loading || !!cart.error}
                  onClick={() =>
                    action(async () => {
                      const result = await cart.checkout();
                      if (result)
                        navigate('/student/courses', { state: { purchased: result.purchased } });
                    })
                  }
                >
                  {cart.busy ? 'Đang xử lý...' : 'Mua khóa học'}
                </button>
              ) : (
                <Link className="btn btn-primary" to="/account/signin?returnTo=/cart">
                  Đăng nhập để mua
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
