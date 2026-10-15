import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider.jsx';
import { api } from '../../lib/http.js';
import { ErrorMessage } from '../../components/Feedback.jsx';

export default function ProfilePage({ passwordOnly = false }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event, password = false) {
    event.preventDefault();
    if (busy) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    if (password && body.newPassword !== body.confirmPassword) {
      setError(new Error('Mật khẩu xác nhận không khớp.'));
      return;
    }
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      await api.request(password ? '/me/password' : '/me/profile', { method: 'PATCH', body });
      if (password) {
        auth.clearSession();
        navigate('/account/signin', {
          replace: true,
          state: { message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.' },
        });
      } else {
        await auth.reloadUser();
        setMessage('Đã cập nhật hồ sơ.');
      }
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>{passwordOnly ? 'Đổi mật khẩu' : 'Hồ sơ của tôi'}</h1>
      <ErrorMessage error={error} />
      {message && (
        <p className="alert alert-success" role="status">
          {message}
        </p>
      )}
      <div className="row g-4">
        {!passwordOnly && (
          <div className="col-lg-6">
            <form className="card card-body" onSubmit={(event) => submit(event)}>
              <h2 className="h4">Thông tin cá nhân</h2>
              <p className="text-secondary">Tên đăng nhập: {auth.user.username}</p>
              <label className="form-label" htmlFor="profile-name">
                Họ tên
              </label>
              <input
                className="form-control mb-3"
                id="profile-name"
                name="name"
                defaultValue={auth.user.name}
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
              <label className="form-label" htmlFor="profile-email">
                Email
              </label>
              <input
                className="form-control mb-3"
                id="profile-email"
                name="email"
                type="email"
                defaultValue={auth.user.email}
                required
                maxLength={254}
                autoComplete="email"
              />
              <button className="btn btn-primary" disabled={busy}>
                Lưu hồ sơ
              </button>
            </form>
          </div>
        )}
        <div className="col-lg-6">
          <form className="card card-body" onSubmit={(event) => submit(event, true)}>
            <h2 className="h4">Đổi mật khẩu</h2>
            {[
              ['currentPassword', 'Mật khẩu hiện tại', 'current-password'],
              ['newPassword', 'Mật khẩu mới', 'new-password'],
              ['confirmPassword', 'Xác nhận mật khẩu mới', 'new-password'],
            ].map(([name, label, autocomplete]) => (
              <div key={name} className="mb-3">
                <label className="form-label" htmlFor={name}>
                  {label}
                </label>
                <input
                  className="form-control"
                  id={name}
                  name={name}
                  type="password"
                  required
                  minLength={name === 'currentPassword' ? undefined : 8}
                  autoComplete={autocomplete}
                />
              </div>
            ))}
            <p className="small text-secondary">Đổi mật khẩu sẽ đăng xuất các phiên hiện tại.</p>
            <button className="btn btn-primary" disabled={busy}>
              Đổi mật khẩu
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
