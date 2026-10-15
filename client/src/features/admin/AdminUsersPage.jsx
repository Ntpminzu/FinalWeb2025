import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useResource } from '../../lib/useResource.js';
import { api } from '../../lib/http.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { ResourceState, ErrorMessage, Empty } from '../../components/Feedback.jsx';
import Pagination from '../../components/Pagination.jsx';
import ManagementFilters from '../../components/ManagementFilters.jsx';

export default function AdminUsersPage() {
  const [params] = useSearchParams();
  const resource = useResource(`/admin/users?${params}`);
  const { user: currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function mutate(user, action) {
    if (
      !window.confirm(
        `${action === 'delete' ? 'Xóa' : action === 'role' ? 'Chuyển thành giảng viên' : user.isDisabled ? 'Mở khóa' : 'Khóa'} tài khoản “${user.username}”?`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await api.request(`/admin/users/${user.id}${action === 'delete' ? '' : `/${action}`}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        body:
          action === 'delete'
            ? undefined
            : action === 'role'
              ? { permission: 2 }
              : { isDisabled: !user.isDisabled },
      });
      resource.reload();
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>Quản lý người dùng</h1>
      <ManagementFilters users />
      <ErrorMessage error={error} />
      <ResourceState resource={resource}>
        {!resource.data?.length ? (
          <Empty>Không có người dùng phù hợp.</Empty>
        ) : (
          <div className="card table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {resource.data.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <small className="d-block text-secondary">{user.username}</small>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {
                        { student: 'Học viên', instructor: 'Giảng viên', admin: 'Quản trị' }[
                          user.role
                        ]
                      }
                    </td>
                    <td>{user.isDisabled ? 'Đã khóa' : 'Đang hoạt động'}</td>
                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        {user.permission === 1 && (
                          <button
                            className="btn btn-outline-primary btn-sm"
                            disabled={busy}
                            onClick={() => mutate(user, 'role')}
                          >
                            Chuyển giảng viên
                          </button>
                        )}
                        <button
                          className="btn btn-outline-warning btn-sm"
                          disabled={busy || currentUser.id === user.id}
                          onClick={() => mutate(user, 'status')}
                        >
                          {user.isDisabled ? 'Mở khóa' : 'Khóa'}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={busy || currentUser.id === user.id}
                          onClick={() => mutate(user, 'delete')}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={resource.result?.pagination} />
      </ResourceState>
    </section>
  );
}
