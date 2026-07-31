# FinalWeb2025 — Online Academy

Ứng dụng học trực tuyến server-rendered sử dụng Express 5, PostgreSQL, Knex và Handlebars. Hệ thống hỗ trợ ba vai trò Student, Instructor và Admin với các luồng mua khóa học, học bài, lưu tiến độ, đánh giá, quản lý khóa học và quản trị người dùng.

## Kiến trúc

```text
Route → Middleware → Controller → Service → DAO → PostgreSQL
                              ↓
                       Validator/Schema
```

- `routes/`: khai báo URL, HTTP method và chuỗi middleware/controller.
- `middlewares/`: xác thực, phân quyền, CSRF, bảo mật, upload, ownership và xử lý lỗi.
- `controllers/`: chuyển request HTTP thành lời gọi service và trả response.
- `services/`: business rules và điều phối nhiều DAO.
- `validators/`: chuẩn hóa và kiểm tra dữ liệu đầu vào.
- `daos/`: truy vấn PostgreSQL bằng Knex; không phụ thuộc Express.
- `models/`: entity có hành vi cục bộ như Cart và Progress.
- `config/`: database, session, environment và Handlebars.
- `errors/`: hệ thống lỗi nghiệp vụ có HTTP status/code.
- `tests/`: unit test cho schema và domain behavior.
- `views/`, `static/`: giao diện Handlebars và tài nguyên công khai.

`app.js` chỉ tạo Express application. `server.js` là entrypoint mở cổng mạng, nhờ đó test có thể import app mà không tự khởi động server.

## Chạy dự án

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run db:seed
npm test
npm start
```

Cập nhật thông tin PostgreSQL và `SESSION_SECRET` trong `.env` trước khi chạy. Migration tạo toàn bộ schema và seed thêm các lĩnh vực mẫu.

## Kiểm tra

```bash
npm run check
npm run test:unit
npm test
```

`npm run check` kiểm tra cú pháp toàn bộ JavaScript và compile tất cả Handlebars templates. `npm run test:unit` kiểm tra validation và domain behavior.

## Các nhóm chức năng

- Account: đăng ký trực tiếp, đăng nhập, đăng xuất, hồ sơ và đổi mật khẩu.
- Student: watchlist, giỏ hàng, checkout, khóa học đã mua, xem lecture, tiến độ và feedback.
- Instructor: hồ sơ, tạo/sửa khóa học, quản lý lecture và xuất bản khóa học.
- Admin: dashboard, user, instructor, course và category management.
- Security: PostgreSQL session store, role/ownership authorization, CSRF, rate limiting, Helmet và giới hạn upload.
