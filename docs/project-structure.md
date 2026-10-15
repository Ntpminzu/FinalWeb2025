# Cấu trúc theo chức năng

Backend giữ Express/JavaScript. Source nằm trong `backend/src/modules/<feature>/`; mỗi chức năng chứa các tầng cần dùng. React/Vite nằm trong `client/`, cũng tổ chức page/component theo chức năng. Xem [frontend](frontend.md).

## Các module

| Module | Trách nhiệm |
|---|---|
| auth | Đăng ký/đăng nhập, JWT/refresh/logout, middleware auth và CSRF |
| users | Hồ sơ chung, đổi mật khẩu, user model/repository và trang hồ sơ ba vai trò |
| courses | Catalog, tìm kiếm, chi tiết khóa học, course repository và DTO |
| categories | Cây danh mục và khóa học theo danh mục |
| home | Dữ liệu và trang chủ |
| cart | Giỏ hàng, checkout, idempotency, cart model và DTO |
| learning | Khóa đã mua, bài học, tiến độ, lecture/progress/purchased |
| watchlist | Danh sách yêu thích và thao tác thêm/xóa |
| reviews | Điều kiện đánh giá, đọc/tạo/sửa feedback và feedback DTO |
| instructor | Hồ sơ chuyên môn, dashboard và nghiệp vụ quản lý giảng viên |
| admin | Dashboard và nghiệp vụ quản trị user/course/category |

## Ví dụ một module

```text
backend/src/modules/courses/
  routes/{courses.api.routes.js,courses.web.routes.js}
  controllers/{course.api.controller.js,course.web.controller.js,search.web.controller.js}
  services/course.service.js
  repositories/course.repository.js
  domain/course.model.js
  schemas/course.schema.js
  dto/course.dto.js
```

Route khai báo URL và guard. Controller lấy dữ liệu HTTP và gọi service. Service xử lý business logic, điều phối repository. Repository truy vấn/ghi DB; domain chứa model có hành vi cục bộ; schema kiểm tra input và DTO định dạng dữ liệu gửi đi.

Service có thể phối hợp repository của chức năng liên quan; repository dùng chung có một nơi sở hữu. Course repository thuộc `courses`, user repository thuộc `users`. Controller dùng mapper từ `dto/` thay vì import controller khác.

## Các phần đã tách trách nhiệm

| File trước đây | Các module sở hữu hiện tại |
|---|---|
| account.service.js | auth/services/auth.service.js; users/services/user.service.js |
| catalog.service.js | courses/services/course.service.js; categories/services/category.service.js; home/services/home.service.js |
| student.service.js | watchlist/services/watchlist.service.js; learning/services/learning.service.js |
| session-context.service.js | listCategories trong category service; ownedCourseIds trong learning service |
| me.api.controller.js | user API controller, watchlist API controller, review API controller |
| account.controller.js | auth web controller; user web controller |
| student.controller.js | user profile, watchlist và purchased web controllers |
| DTO được khai báo và import giữa controller | dto/ của users, courses, learning, reviews và cart |

Các đường dẫn ở cột sau tương đối với `backend/src/modules/`. Các controller web profile giữ đúng template của từng vai trò.

## Router và quyền truy cập

`backend/src/routes/api.routes.js` ghép module API, đặt quy ước body/cache và JSON 404. Router module giữ đường dẫn đầy đủ tương đối với `/api/v1`, ví dụ `/courses`, `/me/watchlist`, `/instructor/courses`.

`backend/src/routes/web.routes.js` ghép module web. Guard gắn vào các route bảo vệ; URL `/account`, `/student`, `/instructor`, `/admin` giữ nguyên. API được mount trước session middleware; HTML tiếp tục dùng session/CSRF.

Test contract duyệt router lồng nhau và đối chiếu từng method/path với OpenAPI để giữ đủ 56 thao tác.

## Ví dụ checkout

```text
POST /api/v1/checkout
  → cart/routes/cart.api.routes.js
  → auth/middlewares/api-auth.middleware.js
  → cart/controllers/cart.api.controller.js
  → cart/services/cart.service.js
  → users/repositories/user.repository.js          khóa user
  → cart/repositories/cart.repository.js          đọc giỏ và giá
  → learning/repositories/purchased.repository.js ghi lượt mua
  → cart/repositories/idempotency.repository.js   lưu kết quả retry
  → cart/repositories/cart.repository.js          xóa giỏ đã mua
```

Transaction mở qua `common/database/transaction.js`. Mọi repository tham gia dùng cùng connection. Service kiểm tra snapshot, sở hữu và điều kiện báo ConflictError; Knex/SQL nằm trong repository hoặc hạ tầng transaction.

## Cấu hình và tài nguyên

- `src/config/paths.js`: backend root, repository root, migrations/seeds, OpenAPI và upload root.
- `src/config/load-env.js`: đọc `backend/.env` dù process được mở từ thư mục nào.
- `backend/views`, `backend/static`: tài nguyên Handlebars hiện tại.
- `backend/uploads`: ảnh được chuyển nguyên trạng, URL `/uploads/...` giữ nguyên. Uploader và static server dùng chung `UPLOAD_ROOT`.
- `backend/database/migrations`: giữ tên migration để khớp lịch sử DB; đợt refactor không chạy migration lên database đang kết nối.
- `backend/tests`: tests dùng PostgreSQL nhúng và upload tạm, không ghi Supabase.
- `docs/`: tài liệu ở root, tests đọc bằng đường dẫn từ `paths.js`.

## Lệnh chạy

`npm run install:backend` và `npm run install:client` cài từng lockfile. Root `npm run dev` chạy frontend/backend, `npm run build` build React, `npm start` phục vụ bản build qua Express, `npm test` chạy backend và client tests. `npm run dev:backend`/`npm run start:backend` chạy backend riêng; `npm run dev:demo` dùng PostgreSQL nhúng thay database thật. Dependencies thuộc từng package.

`npm run check` quét `src/`, `database/`, `tests/`, `scripts/`, kiểm tra import tương đối và ranh giới tầng. Graphify chạy tại repository root: `graphify update .`.
