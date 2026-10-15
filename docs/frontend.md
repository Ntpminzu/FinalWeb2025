# React frontend

React/JavaScript chạy trong `client/`, Vite build ra `client/dist/`. Giao diện giữ Bootstrap, icon, font và CSS của Handlebars. Header/footer, card, pagination và trạng thái tải/lỗi dùng chung; page và component riêng nằm trong `src/features/<feature>/`. Backend giữ nghiệp vụ, giá, quyền và truy vấn DB.

## Chạy ngay với dữ liệu demo

```powershell
npm run install:backend
npm run install:client
npm run dev:demo
```

Mở **http://127.0.0.1:5174**. Tài khoản: `student`, `teacher`, `admin`; cùng mật khẩu `Demo12345!`.

Demo API chạy tại `127.0.0.1:4100` bằng PostgreSQL nhúng trong bộ nhớ, tự tạo dữ liệu tạm mỗi lần khởi động và có video WebM 10 giây để thử học/lưu tiến độ. Upload dùng thư mục tạm. Không kết nối, migrate hoặc seed Supabase. Dữ liệu demo mất khi tắt server; các tài khoản này không được tạo trên database thật. Nếu port đang bận, dừng đúng instance demo trước khi chạy lại.

## Chạy với database trong backend/.env

```powershell
npm run dev
```

React tại **http://localhost:5173**, backend mặc định **http://localhost:4000**. Vite chuyển tiếp `/api/*` và `/uploads/*` sang backend, giữ nguyên prefix. Có thể copy `client/.env.example` thành `client/.env` để đổi `API_PROXY_TARGET` hoặc `CLIENT_PORT`; backend phải cho origin frontend tương ứng trong `FRONTEND_ORIGINS`. Đổi port backend phải sửa cả proxy target.

Root `dev` chạy hai process trực tiếp và dừng chúng khi Ctrl+C. Vite tự cập nhật frontend; sau khi sửa backend, khởi động lại lệnh. Khi cần backend watch riêng: mở hai terminal chạy `npm run dev:backend` và `npm run dev:client`.

Đăng nhập JWT, giỏ DB và checkout trên database thật cần các migration `002`/`003`. Việc tạo React không tự áp dụng migration. Dùng quy trình database của [API v1](api-v1.md) khi triển khai lên môi trường đích; không reset hoặc seed đè dữ liệu.

Trang Handlebars vẫn ở backend khi `SERVE_CLIENT` không bật. Session web và JWT React độc lập; đăng nhập bản cũ không tự đăng nhập React, giỏ khách của bản cũ cũng không được đọc từ React.

## Build và chạy bản build

```powershell
npm run build
npm start
```

Root `start` bật `SERVE_CLIENT=true`: Express phục vụ `client/dist`, `/api/v1` và `/uploads` cùng origin. Dùng `npm run start:backend` để chạy riêng backend theo cấu hình của nó. Không dùng Vite preview làm server production.

API được xử lý trước SPA và giữ JSON 404. Thiếu file assets/upload trả 404; GET HTML như `/student/courses/1` trả `index.html` rồi React xử lý route/quyền. Nhánh SPA nằm trước session/CSRF/DB context của Handlebars, nên tải SPA không tạo session web. Giữ cấu hình HTTPS, `NODE_ENV=production`, cookie Secure và origin chính xác khi triển khai; không mở CORS `*`. Khi hosting frontend riêng, reverse proxy `/api` và `/uploads` cùng site thay vì chỉ upload `dist` rồi trông chờ proxy của Vite.

`client/.env` chỉ chứa cấu hình frontend công khai hoặc cấu hình dev proxy; không copy DB password/JWT secret từ `backend/.env` vào client.

## Luồng xác thực và dữ liệu

- `src/lib/http.js` quản lý fetch, Bearer token, cookie, JSON/multipart, 204 và lỗi API. Access token chỉ ở bộ nhớ. Refresh token nằm trong cookie HttpOnly do backend quản lý.
- Tải lại trang: `GET /auth/csrf-token` → `POST /auth/refresh` → `GET /auth/me`. Các request cùng tab dùng một promise refresh. Web Locks khóa chuỗi đọc CSRF/refresh giữa các tab; BroadcastChannel thông báo đăng nhập/đăng xuất. Trình duyệt không có Web Locks chỉ đảm bảo trong một tab.
- API 401 được refresh và thử lại tối đa một lần; lỗi đăng nhập công khai không refresh. Request từ tài khoản cũ không thử lại bằng token của tài khoản mới. Đổi người dùng sẽ hủy state riêng của page/cart.
- `RequireAuth` chờ khôi phục phiên, giữ đường dẫn quay lại nội bộ và kiểm tra vai trò. Backend tiếp tục quyết định quyền sở hữu và quyền thao tác.
- Giỏ khách chỉ lưu ID trong localStorage; giá lấy từ API. Sau đăng nhập học viên, nhập giỏ vào DB, loại khóa đã sở hữu, báo khóa không còn khả dụng và giữ ID chưa nhập nếu lỗi mạng. Không nhập giỏ khách vào tài khoản instructor/admin.
- Checkout giữ key và snapshot ID trong sessionStorage cho cùng giao dịch để thử lại khi lỗi mạng. Backend kiểm tra lại giỏ/giá và bảo đảm transaction/idempotency.
- Quill gửi `getText()` như bản cũ. Mô tả/comment được React escape dưới dạng text; không render HTML thô. Plyr được tạo/dọn cùng component; ghi tiến độ định kỳ, pause, kết thúc và chuyển bài. Keepalive hỗ trợ lúc rời trang nhưng không bảo đảm ghi được khi mất mạng/đóng trình duyệt đột ngột.
- Sau mutation, các danh sách/số liệu liên quan được tải lại. Không có cơ chế tự động retry mọi POST/DELETE. Search/filter/page lưu trong URL; tìm kiếm tuân theo full-text API (ví dụ `ReactJS`, không phải tìm tiền tố `React` của từ `ReactJS`).

Audit frontend hiện báo một cảnh báo low của Quill 2.0.3 ở chức năng HTML export; luồng hiện tại chỉ đọc text và không hiển thị HTML xuất từ editor. Khi thay đổi hợp đồng sang HTML, phải xử lý lại [advisory của Quill](https://github.com/advisories/GHSA-v3m3-f69x-jf25) cùng quy tắc sanitize.

## Các màn hình

| Nhóm | Đường dẫn chính |
|---|---|
| Public | `/`, `/courses`, `/search`, `/categories/:categoryId`, `/courses/:courseId` |
| Tài khoản | `/account/signin`, `/account/signup`, `/account/profile`, `/account/change-pwd` |
| Giỏ | `/cart` |
| Học viên | `/student`, `/student/profile`, `/student/watchlist`, `/student/courses`, `/student/courses/:courseId`, `/student/courses/:courseId/:lectureId`, `/student/course/:courseId/feedback` |
| Giảng viên | `/instructor/dashboard`, `/instructor/courses`, `/instructor/new`, `/instructor/edit/course/:courseId`, `/instructor/edit/lectures/:courseId`, `/instructor/profile` |
| Quản trị | `/admin`, `/admin/users`, `/admin/courses`, `/admin/categories`, `/admin/profile` |

## Kiểm tra

```powershell
npm test
npm run build
# Chạy một lần để cài Chromium cho Playwright vào workspace:
cd client
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.browsers'
npx playwright install chromium
cd ..
npm run test:e2e
graphify update .
```

E2E tự bật/tắt demo server, yêu cầu port 4100/5174 trống và build hiện tại trong `client/dist/`. Có thể dùng browser đã cài qua biến `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` trỏ tới executable Chromium. Kết quả/ảnh/trace ở `client/test-results/`, được gitignore. Tests chạy API thật với PostgreSQL nhúng; không thay thế kiểm thử trên Supabase/HTTPS thật.
