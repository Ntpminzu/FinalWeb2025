import { NavLink, Outlet } from 'react-router';
const links = {
  student: [
    ['/student', 'Tổng quan'],
    ['/student/courses', 'Khóa học của tôi'],
    ['/student/watchlist', 'Yêu thích'],
    ['/student/profile', 'Hồ sơ'],
  ],
  instructor: [
    ['/instructor/dashboard', 'Tổng quan'],
    ['/instructor/courses', 'Khóa học'],
    ['/instructor/new', 'Tạo khóa học'],
    ['/instructor/profile', 'Hồ sơ'],
  ],
  admin: [
    ['/admin', 'Tổng quan'],
    ['/admin/users', 'Người dùng'],
    ['/admin/courses', 'Khóa học'],
    ['/admin/categories', 'Danh mục'],
    ['/admin/profile', 'Hồ sơ'],
  ],
};
export default function RoleLayout({ role }) {
  return (
    <>
      <nav className="role-nav nav nav-pills gap-2 mb-4" aria-label="Điều hướng tài khoản">
        {links[role].map(([to, label]) => (
          <NavLink
            key={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
            to={to}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  );
}
