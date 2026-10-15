import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import MainLayout from '../layouts/MainLayout.jsx';
import RoleLayout from '../layouts/RoleLayout.jsx';
import { RequireAuth } from '../features/auth/AuthProvider.jsx';
import { Loading, NotFound } from '../components/Feedback.jsx';

const Home = lazy(() => import('../features/home/HomePage.jsx'));
const CourseList = lazy(() => import('../features/courses/CourseListPage.jsx'));
const CourseDetail = lazy(() => import('../features/courses/CourseDetailPage.jsx'));
const Auth = lazy(() => import('../features/auth/AuthPage.jsx'));
const Profile = lazy(() => import('../features/users/ProfilePage.jsx'));
const Cart = lazy(() => import('../features/cart/CartPage.jsx'));
const MyCourses = lazy(() => import('../features/learning/MyCoursesPage.jsx'));
const CourseLearning = lazy(() => import('../features/learning/CourseLearningPage.jsx'));
const Lecture = lazy(() => import('../features/learning/LecturePage.jsx'));
const Review = lazy(() => import('../features/reviews/ReviewPage.jsx'));
const Watchlist = lazy(() => import('../features/watchlist/WatchlistPage.jsx'));
const InstructorCourses = lazy(() => import('../features/instructor/InstructorCoursesPage.jsx'));
const CourseEditor = lazy(() => import('../features/instructor/CourseEditorPage.jsx'));
const LectureManager = lazy(() => import('../features/instructor/LectureManagerPage.jsx'));
const InstructorProfile = lazy(() => import('../features/instructor/InstructorProfilePage.jsx'));
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboardPage.jsx'));
const AdminUsers = lazy(() => import('../features/admin/AdminUsersPage.jsx'));
const AdminCourses = lazy(() => import('../features/admin/AdminCoursesPage.jsx'));
const AdminCategories = lazy(() => import('../features/admin/AdminCategoriesPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="search" element={<CourseList />} />
          <Route path="categories/:categoryId" element={<CourseList />} />
          <Route path="courses/:courseId" element={<CourseDetail />} />
          <Route path="account/signin" element={<Auth />} />
          <Route path="account/signup" element={<Auth register />} />
          <Route path="cart" element={<Cart />} />
          <Route element={<RequireAuth />}>
            <Route path="account/profile" element={<Profile />} />
            <Route path="account/change-pwd" element={<Profile passwordOnly />} />
          </Route>
          <Route element={<RequireAuth roles={['student']} />}>
            <Route path="student" element={<RoleLayout role="student" />}>
              <Route index element={<MyCourses overview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="courses" element={<MyCourses />} />
              <Route path="courses/:courseId" element={<CourseLearning />} />
              <Route path="courses/:courseId/:lectureId" element={<Lecture />} />
              <Route path="course/:courseId/feedback" element={<Review />} />
              <Route path="watchlist" element={<Watchlist />} />
            </Route>
          </Route>
          <Route element={<RequireAuth roles={['instructor']} />}>
            <Route path="instructor" element={<RoleLayout role="instructor" />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<InstructorCourses dashboard />} />
              <Route path="courses" element={<InstructorCourses />} />
              <Route path="new" element={<CourseEditor />} />
              <Route path="edit/course/:courseId" element={<CourseEditor />} />
              <Route path="edit/lectures/:courseId" element={<LectureManager />} />
              <Route path="profile" element={<InstructorProfile />} />
              <Route path="profile/edit" element={<InstructorProfile />} />
            </Route>
          </Route>
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="admin" element={<RoleLayout role="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
          <Route path="403" element={<NotFound forbidden />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
