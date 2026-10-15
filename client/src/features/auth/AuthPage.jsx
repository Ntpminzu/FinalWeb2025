import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from './AuthProvider.jsx';
import { api } from '../../lib/http.js';
import { safeReturnTo } from '../../lib/format.js';
import { ErrorMessage, Loading } from '../../components/Feedback.jsx';

export default function AuthPage({ register = false }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [availability, setAvailability] = useState('');
  const returnTo = safeReturnTo(params.get('returnTo'), '/');
  if (!auth.ready) return <Loading />;
  if (auth.user)
    return <Navigate to={returnTo.startsWith('/account/sign') ? '/' : returnTo} replace />;
  async function checkUsername(event) {
    const username = event.target.value.trim();
    if (username.length < 3) return;
    try {
      const { data } = await api.request(
        `/auth/username-availability?username=${encodeURIComponent(username)}`,
        { auth: false },
      );
      setAvailability(
        data.available ? 'Tên đăng nhập có thể sử dụng.' : 'Tên đăng nhập đã được sử dụng.',
      );
    } catch (error) {
      setAvailability(error.message);
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    if (register && body.password !== body.confirmPassword) {
      setError(new Error('Mật khẩu xác nhận không khớp.'));
      return;
    }
    if (body.dob === '') delete body.dob;
    setBusy(true);
    setError(null);
    try {
      await (register ? auth.register(body) : auth.login(body));
      navigate(returnTo.startsWith('/account/sign') ? '/' : returnTo, { replace: true });
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page py-4">
      <div className="card shadow-sm mx-auto auth-card">
        <div className="card-body p-4 p-md-5">
          <span className="section-kicker">Online Academy</span>
          <h1 className="h3 mb-4">{register ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
          <ErrorMessage error={error} />
          {location.state?.message && (
            <p className="alert alert-success" role="status">
              {location.state.message}
            </p>
          )}
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="username">
                Tên đăng nhập
              </label>
              <input
                id="username"
                className="form-control"
                name="username"
                required
                minLength={register ? 3 : undefined}
                maxLength={32}
                pattern={register ? '[A-Za-z0-9._-]{3,32}' : undefined}
                autoComplete="username"
                onBlur={register ? checkUsername : undefined}
                onChange={() => setAvailability('')}
              />
              {register && availability && (
                <div className="form-text" role="status">
                  {availability}
                </div>
              )}
            </div>
            {register && (
              <>
                <div className="mb-3">
                  <label htmlFor="full-name" className="form-label">
                    Họ tên
                  </label>
                  <input
                    id="full-name"
                    name="name"
                    className="form-control"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control"
                    required
                    maxLength={254}
                    autoComplete="email"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="dob" className="form-label">
                    Ngày sinh (không bắt buộc)
                  </label>
                  <input
                    id="dob"
                    name="dob"
                    type="date"
                    className="form-control"
                    autoComplete="bday"
                  />
                </div>
              </>
            )}
            <div className="mb-3">
              <label className="form-label" htmlFor="password">
                Mật khẩu
              </label>
              <input
                id="password"
                className="form-control"
                type="password"
                name="password"
                required
                minLength={register ? 8 : undefined}
                autoComplete={register ? 'new-password' : 'current-password'}
              />
            </div>
            {register && (
              <div className="mb-3">
                <label className="form-label" htmlFor="confirm-password">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirm-password"
                  className="form-control"
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            )}
            <button className="btn btn-primary w-100" disabled={busy}>
              {busy ? 'Đang xử lý...' : register ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </form>
          <p className="mt-3 mb-0 text-center">
            {register ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
            <Link
              to={`/account/${register ? 'signin' : 'signup'}?returnTo=${encodeURIComponent(returnTo)}`}
            >
              {register ? 'Đăng nhập' : 'Đăng ký'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
