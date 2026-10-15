import { Component } from 'react';
import { Link } from 'react-router';

export function Loading() {
  return (
    <p role="status" className="py-4 text-center">
      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
      Đang tải...
    </p>
  );
}
export function ErrorMessage({ error }) {
  return error ? (
    <div className="alert alert-danger" role="alert">
      {error.message || error}
    </div>
  ) : null;
}
export function Empty({ children = 'Chưa có dữ liệu.' }) {
  return <div className="empty-state py-5 text-center text-secondary">{children}</div>;
}
export function ResourceState({ resource, children }) {
  if (resource.loading) return <Loading />;
  if (resource.error)
    return (
      <>
        <ErrorMessage error={resource.error} />
        <button className="btn btn-outline-primary" onClick={resource.reload}>
          Thử lại
        </button>
      </>
    );
  return children;
}
export function NotFound({ forbidden = false }) {
  return (
    <div className="text-center py-5">
      <h1>{forbidden ? '403' : '404'}</h1>
      <p>{forbidden ? 'Bạn không có quyền truy cập trang này.' : 'Không tìm thấy trang.'}</p>
      <Link className="btn btn-primary" to="/">
        Về trang chủ
      </Link>
    </div>
  );
}
export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="container py-5">
        <h1>Không thể mở trang</h1>
        <p>Vui lòng tải lại để thử lại.</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>
          Tải lại
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
