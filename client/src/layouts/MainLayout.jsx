import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../features/auth/AuthProvider.jsx';
import { useCart } from '../features/cart/CartProvider.jsx';
import { useCategories } from '../app/providers.jsx';
import { ErrorMessage } from '../components/Feedback.jsx';
import ChatbotWidget from '../features/chatbot/ChatbotWidget.jsx';

export default function MainLayout() {
  const auth = useAuth();
  const cart = useCart();
  const categories = useCategories();
  const [menu, setMenu] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const [logoutError, setLogoutError] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setMenu(false);
    setDropdown(null);
    setLogoutError(null);
    document.title = 'Online Academy';
    window.scrollTo(0, 0);
  }, [location.pathname]);
  async function signOut() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await auth.logout();
      navigate('/account/signin');
    } catch (error) {
      setLogoutError(error);
    } finally {
      setLoggingOut(false);
    }
  }
  const toggle = (value) => setDropdown((current) => (current === value ? null : value));
  return (
    <>
      <a className="skip-link" href="#main-content">
        Bỏ qua điều hướng
      </a>
      <header className="site-header sticky-top">
        <nav className="navbar navbar-expand-lg" aria-label="Điều hướng chính">
          <div className="container-xl">
            <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
              <img src="/imgs/logo.png" width="42" height="42" alt="" />
              <span className="brand-name">Online Academy</span>
            </Link>
            <button
              className="navbar-toggler"
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-controls="mainNavbar"
              aria-label="Mở menu điều hướng"
            >
              <span className="navbar-toggler-icon" />
            </button>
            <div className={`collapse navbar-collapse ${menu ? 'show' : ''}`} id="mainNavbar">
              <ul className="navbar-nav ms-lg-3">
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle"
                    onClick={() => toggle('categories')}
                    aria-expanded={dropdown === 'categories'}
                  >
                    Khám phá
                  </button>
                  <ul className={`dropdown-menu ${dropdown === 'categories' ? 'show' : ''}`}>
                    {categories.flat.map((category) => (
                      <li key={category.id}>
                        <Link
                          className={`dropdown-item ${category.parent_id ? 'ps-4' : 'fw-semibold'}`}
                          to={`/categories/${category.id}`}
                          onClick={() => setDropdown(null)}
                        >
                          {category.parent_id ? '↳ ' : ''}
                          {category.name}
                        </Link>
                      </li>
                    ))}
                    {categories.error && (
                      <li className="px-3 small text-danger">
                        Chưa tải được danh mục.{' '}
                        <button className="btn btn-link btn-sm" onClick={categories.reload}>
                          Thử lại
                        </button>
                      </li>
                    )}
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/courses">
                        Tất cả khóa học
                      </Link>
                    </li>
                  </ul>
                </li>
              </ul>
              <form
                className="navbar-search mx-lg-3 my-3 my-lg-0"
                role="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  const q = new FormData(event.currentTarget).get('q');
                  navigate(`/search?q=${encodeURIComponent(q)}`);
                }}
              >
                <label className="visually-hidden" htmlFor="site-search">
                  Tìm kiếm khóa học
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search" aria-hidden="true" />
                  </span>
                  <input
                    className="form-control"
                    id="site-search"
                    name="q"
                    type="search"
                    placeholder="Bạn muốn học gì hôm nay?"
                    maxLength={200}
                  />
                  <button className="btn btn-primary">Tìm kiếm</button>
                </div>
              </form>
              <div className="navbar-actions d-flex align-items-center gap-2 ms-lg-auto">
                {(!auth.user || auth.user.role === 'student') && (
                  <Link
                    className="cart-link btn btn-light position-relative"
                    to="/cart"
                    aria-label={`Giỏ hàng, ${cart.courses.length} khóa học`}
                  >
                    <i className="bi bi-cart3 fs-5" aria-hidden="true" />
                    {cart.courses.length > 0 && (
                      <span className="cart-badge badge rounded-pill bg-danger">
                        {cart.courses.length}
                      </span>
                    )}
                  </Link>
                )}
                {!auth.ready ? (
                  <span className="small text-secondary" role="status">
                    Đang khôi phục phiên...
                  </span>
                ) : auth.user ? (
                  <div className="nav-item dropdown">
                    <button
                      className="user-menu btn btn-light dropdown-toggle"
                      onClick={() => toggle('user')}
                      aria-expanded={dropdown === 'user'}
                    >
                      {auth.user.name}
                    </button>
                    <ul
                      className={`dropdown-menu dropdown-menu-end ${dropdown === 'user' ? 'show' : ''}`}
                    >
                      <li>
                        <Link className="dropdown-item" to={`/${auth.user.role}/profile`}>
                          Hồ sơ của tôi
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to={
                            auth.user.role === 'student'
                              ? '/student/courses'
                              : auth.user.role === 'instructor'
                                ? '/instructor/dashboard'
                                : '/admin'
                          }
                        >
                          {auth.user.role === 'admin' ? 'Quản trị' : 'Khóa học của tôi'}
                        </Link>
                      </li>
                      {auth.user.role === 'student' && (
                        <li>
                          <Link className="dropdown-item" to="/student/watchlist">
                            Danh sách yêu thích
                          </Link>
                        </li>
                      )}
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          disabled={loggingOut}
                          onClick={signOut}
                        >
                          {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <>
                    <Link className="btn btn-outline-primary" to="/account/signin">
                      Đăng nhập
                    </Link>
                    <Link className="btn btn-primary" to="/account/signup">
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
      <main id="main-content" className="site-main container-xl flex-grow-1" tabIndex={-1}>
        <ErrorMessage error={logoutError} />
        {auth.error && (
          <div className="alert alert-warning" role="status">
            Chưa khôi phục được phiên đăng nhập.{' '}
            <button className="btn btn-link btn-sm" onClick={auth.restore}>
              Thử lại
            </button>
          </div>
        )}
        <Outlet />
      </main>
      <footer className="site-footer mt-auto">
        <div className="container-xl d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <img src="/imgs/logo.png" alt="" width="34" height="34" />
            <div>
              <strong>Online Academy</strong>
              <small className="d-block">Học mỗi ngày, tiến xa hơn.</small>
            </div>
          </div>
          <nav className="footer-links" aria-label="Liên kết cuối trang">
            <Link to="/courses">Khóa học</Link>
            <Link to="/account/signup">Bắt đầu học</Link>
          </nav>
        </div>
      </footer>
      <ChatbotWidget key={`${auth.user?.id || 'guest'}:${auth.user?.role || 'guest'}`} />
    </>
  );
}
