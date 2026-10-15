# REST API v1 — JWT và Repository

Base URL: `/api/v1`. Contract request/response của 56 thao tác nằm trong [openapi-v1.yaml](openapi-v1.yaml).

## Kiến trúc và cách chuyển đổi

```text
API route → JWT/role middleware → API controller → service → repository → PostgreSQL
HTML route → session/CSRF middleware → web controller ──────┘
```

Source được tổ chức theo chức năng tại `backend/src/modules/`. Mỗi module chứa các tầng routes, controllers, services, repositories, domain, dto và schemas cần dùng. Service xử lý nghiệp vụ; repository chứa Knex/SQL và khóa bản ghi, hạ tầng transaction nằm trong `backend/src/common/database/transaction.js`. Controller không gọi repository trực tiếp; service không import database hoặc gọi query builder. `npm run check` kiểm tra ranh giới này. Xem [cấu trúc dự án](project-structure.md).

HTML vẫn dùng session `online_academy.sid`. API chỉ chấp nhận JWT Bearer; cookie session web không cấp quyền gọi API. API được mount trước session middleware, nên request API không tạo hoặc gia hạn session HTML.

## Cấu hình và migration

- Biến môi trường nằm trong `backend/.env`, được đọc theo vị trí backend. `SESSION_SECRET`: khóa session HTML; `JWT_SECRET`: khóa ký JWT riêng, mỗi khóa ngẫu nhiên ít nhất 32 ký tự.
- `FRONTEND_ORIGINS`: danh sách origin chính xác, phân cách bằng dấu phẩy. Mặc định gồm `http://localhost:4000` và `http://localhost:5173` khi port là 4000.
- Production dùng HTTPS và cookie Secure. Cookie refresh dùng SameSite=Lax; triển khai FE/API cùng site hoặc reverse proxy `/api`. Nếu triển khai khác site phải thiết kế và kiểm thử lại cookie/CSRF, không chỉ mở CORS `*`.

Database mới: chạy `npm run db:migrate`. Migration `001` tạo schema gốc; `002` thêm `auth_sessions`, `refresh_tokens`, `cart_items`, và tạo `idempotency_keys` khi bảng chưa tồn tại.

Database đã có dữ liệu: dùng runner của dự án:

```powershell
npm run db:migrate
```

`backend/scripts/migrate.js` nhận diện schema cũ, kiểm tra các cột bắt buộc và chỉ áp dụng migration mới. Nó không giả ghi `001` đã chạy. Vì vậy tiếp tục dùng runner này cho các lần sau, không gọi `knex migrate:latest` trực tiếp trên database legacy. `003` thêm unique index không phân biệt hoa/thường cho username/email và bỏ constraint watchlist sai khiến một khóa học chỉ được một người lưu; uniqueness theo user/course vẫn được giữ. Nếu phát hiện username/email trùng, migration dừng và không tự xóa hay đổi thông tin tài khoản. Không reset database hoặc seed đè. Kiểm tra schema/counts và backup theo quy trình triển khai trước khi áp dụng lên database thật.

## Response và lỗi

Thành công: `{ "data": ... }`. Danh sách phân trang có thêm `pagination: { page, limit, total, totalPages }`. Xóa/đổi mật khẩu/đăng xuất thành công trả `204`, không có JSON body.

Lỗi: `{ "error": { "code": "...", "message": "...", "status": 400 } }`.

| Status | Ý nghĩa |
|---|---|
| 400 | Dữ liệu hoặc JSON sai, upload không hợp lệ |
| 401 | Thiếu JWT, token sai/hết hạn, phiên đã thu hồi |
| 403 | Sai vai trò, không sở hữu, tài khoản bị khóa, CSRF/Origin không hợp lệ |
| 404 | Không có tài nguyên hoặc tài nguyên không thuộc giảng viên |
| 409 | Trùng dữ liệu, xung đột nghiệp vụ, tài nguyên còn dữ liệu liên quan |
| 413 | JSON body vượt giới hạn |
| 415 | Login/register không dùng application/json |
| 429 | Vượt giới hạn đăng nhập/đăng ký/kiểm tra username |

ID là số nguyên dương PostgreSQL int32. `page` mặc định 1, `limit` mặc định 12 và tối đa 50. Các endpoint cũ không phân trang như watchlist/khóa đã mua vẫn trả mảng. API không trả password hash hoặc refresh token trong JSON.

## Đăng nhập bằng JWT

1. `POST /auth/login` bằng JSON `{ username, password }`, hoặc `POST /auth/register` với `{ username, name, email, password, confirmPassword, dob? }`.
2. Response có `data.accessToken`, `tokenType: "Bearer"`, `expiresIn: 900`, `csrfToken` và `user`. Backend đặt refresh token vào cookie HttpOnly `academy.refresh` (path `/api/v1/auth`, tối đa 7 ngày).
3. Gọi API bảo vệ bằng `Authorization: Bearer <accessToken>`. FE nên giữ access token trong bộ nhớ; không đưa token vào URL.
4. Sau khi reload, gọi `GET /auth/csrf-token` với cookie để lấy CSRF token (trước login trả null), rồi `POST /auth/refresh` cùng header `x-csrf-token` và `credentials: include`.
5. Refresh thành công trả access token mới, cookie refresh mới và CSRF token mới. FE cập nhật cả hai; gộp các yêu cầu refresh đồng thời thành một request. Refresh token cũ bị dùng lại sẽ thu hồi toàn bộ phiên đó.
6. `POST /auth/logout` dùng Bearer token để thu hồi phiên hiện tại và xóa cookie refresh. Nếu access token đã hết hạn, refresh trước khi logout. `PATCH /me/password` thu hồi toàn bộ phiên JWT, cần đăng nhập lại.

JWT chỉ lưu định danh user/phiên. Mỗi request vẫn kiểm tra phiên và tài khoản trong DB để logout, khóa tài khoản và thay quyền có hiệu lực ngay. Thu hồi JWT không tự xóa session HTML cũ; đó là luồng xác thực riêng trong giai đoạn chuyển đổi.

Ví dụ frontend sau này:

```js
const response = await fetch('/api/v1/auth/login', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
const { data, error } = await response.json();
if (!response.ok) throw new Error(error.message);
// Giữ data.accessToken và data.csrfToken trong trạng thái ứng dụng.
```

Login/register yêu cầu JSON. Refresh dùng cookie và CSRF HMAC gắn với refresh token. Các endpoint Bearer khác không dùng CSRF của session HTML. CORS chỉ cho origin trong allowlist và cho phép `Authorization`, `Content-Type`, `X-CSRF-Token`.

## Các nhóm endpoint

Tất cả đường dẫn bên dưới bỏ prefix `/api/v1` cho gọn.

| Nhóm | Endpoint |
|---|---|
| Public | `GET /health`, `/home`, `/categories`, `/categories/:id/courses`, `/courses`, `/courses/:id` |
| Auth | `GET /auth/csrf-token`, `/auth/username-availability?username=...`, `/auth/me`; `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Hồ sơ chung | `PATCH /me/profile`, `/me/password` |
| Watchlist | `GET /me/watchlist`; `POST /me/watchlist/items`; `DELETE /me/watchlist/items/:courseId` |
| Học tập | `GET /me/courses`, `/me/courses/:courseId/progress`, `/me/courses/:courseId/lectures/:lectureId`; `PATCH /me/lectures/:lectureId/progress`, `/me/lectures/:lectureId/duration` |
| Đánh giá | `GET /courses/:courseId/reviews/me`; `POST /courses/:courseId/reviews`; `PATCH /courses/:courseId/reviews/me` |
| Giỏ hàng | `GET /cart`; `POST /cart/items`; `DELETE /cart/items/:courseId`, `/cart`; `POST /checkout` |
| Giảng viên | `GET /instructor/dashboard`; `GET/POST /instructor/courses`; `GET/PATCH/DELETE /instructor/courses/:courseId`; `PATCH /instructor/courses/:courseId/status` |
| Bài giảng | `GET/POST /instructor/courses/:courseId/lectures`; `PATCH/DELETE /instructor/lectures/:lectureId` |
| Hồ sơ giảng viên | `GET/PATCH /instructor/profile` |
| Quản trị | `GET /admin/dashboard`, `/admin/users`, `/admin/courses`, `/admin/categories` |
| Quản trị người dùng | `PATCH /admin/users/:userId/role`, `/admin/users/:userId/status`; `DELETE /admin/users/:userId` |
| Quản trị khóa học | `PATCH /admin/courses/:courseId/status`; `DELETE /admin/courses/:courseId` |
| Quản trị danh mục | `POST /admin/categories`; `PATCH/DELETE /admin/categories/:categoryId` |

## Quy tắc nghiệp vụ cần cho FE

- Vai trò: student=1, instructor=2, admin=3. Hồ sơ chung dùng được cho mọi vai trò. Cart/watchlist/học tập/review dành cho student; nhóm instructor/admin chỉ cho vai trò tương ứng.
- `GET /courses` hỗ trợ `q`, `categoryId`, `sort` (`relevance`, `newest`, `popular`, `rating_desc`, `price_asc`, `price_desc`). Không tạo endpoint search trùng chức năng.
- Hồ sơ chung PATCH nhận `name`, `email`; trường bỏ qua được giữ nguyên. Đổi mật khẩu nhận `currentPassword`, `newPassword`, `confirmPassword`.
- `POST /cart/items` và watchlist nhận `{ courseId }`. Giỏ lưu theo user; API không nhận giá từ client. Giá khuyến mãi bằng 0 vẫn là miễn phí. Khi login web, giỏ session khách được nhập vào giỏ DB, bỏ trùng/khóa học đã sở hữu và không nhập lại sau checkout.
- Checkout nhận `{ idempotencyKey, courseIds }`: snapshot các ID duy nhất phải khớp giỏ. Mua, lưu kết quả idempotency và xóa giỏ commit trong một transaction. Gửi lại cùng key/payload trả 200 `reused: true`; mua lần đầu trả 201. Chưa có cổng thanh toán bên ngoài.
- Tiến độ nhận `{ lastSecond }`; backend kiểm tra đã mua, giới hạn theo thời lượng và không ghi lùi. Đạt 90% một bài thì hoàn thành bài; tỷ lệ khóa học tính từ số bài hoàn thành.
- Thời lượng do giảng viên cung cấp. Endpoint duration của học viên chỉ đối chiếu `{ durationSec }`, không sửa metadata chung. Bài cũ chưa có thời lượng cần giảng viên cập nhật qua PATCH lecture; học viên nhận 409 khi chưa có thời lượng.
- Review chỉ tạo được khi đã mua và hoàn thành ít nhất một bài. API đọc review của mình trả `canReview`, `completion`, `review` (null nếu chưa có). POST trùng trả 409; PATCH review chưa tồn tại trả 404.
- Tạo khóa học nhận `{ title, categoryId, shortDescription?, fullDescription?, price, salePrice? }`. JSON hoặc multipart có thêm `thumbnail`. Thumbnail JPEG/PNG/WebP tối đa 5 MiB, kiểm tra chữ ký định dạng và dọn file mới khi request thất bại. PATCH giữ các trường không gửi và ảnh hiện tại.
- Thêm bài nhận `{ title, videoUrl, durationSec }`, duration 1–43200 giây; PATCH metadata để sửa. Video dùng URL HTTP/HTTPS, không có upload/stream video riêng.
- `PATCH /instructor/courses/:id/status` nhận `{ isCompleted: boolean }`, tương ứng cột `Status` hiện tại. Đây là hoàn thành nội dung khóa học, không phải trạng thái xuất bản. Đặt true cần ít nhất một bài. Gọi lại cùng giá trị không đảo trạng thái.
- Admin khóa/mở nhận `{ isDisabled: boolean }`. Khóa khóa học ảnh hưởng catalog public, độc lập với isCompleted. Danh sách quản trị hỗ trợ `q`, `disabled`, `page`, `limit`; user có thêm `permission`, khóa học có thêm `categoryId`.
- Admin chỉ được chuyển student thành instructor bằng `{ permission: 2 }`; backend tạo hồ sơ instructor cùng transaction. Không hỗ trợ tự nâng lên admin. Không khóa/xóa chính tài khoản admin đang sử dụng.
- Không xóa user có lịch sử mua hoặc khóa học đã tạo; không xóa khóa học đã có người mua; không xóa danh mục còn khóa học hoặc danh mục con. Các trường hợp đó trả 409 để bảo toàn dữ liệu.

## Kiểm tra trước khi làm frontend

```powershell
npm test
graphify update .
```

API integration tests thực thi Express → service → repository → PostgreSQL nhúng, gồm refresh/replay/logout, phân quyền, checkout retry, học/review, upload cleanup và HTML/session tương thích. Migration được kiểm tra với dữ liệu và idempotency history có sẵn. Đây không phải bằng chứng đã triển khai hoặc kiểm thử tải trên Supabase thật. PGlite dùng pool một connection, nên bài kiểm thử request đồng thời kiểm tra kết quả/idempotency; không thay thế kiểm thử khóa tranh chấp với nhiều kết nối PostgreSQL thật.

React frontend đã có trong `client/`; xem [cách chạy và kiểm thử](frontend.md). Có thể phát triển với database demo nhúng. Khi tích hợp database đích, cần áp dụng migration an toàn, cấu hình HTTPS/origin/cookie tương ứng và chạy smoke test với tài khoản của môi trường đó trước khi sử dụng đầy đủ API JWT/cart.

## Chatbot RAG local

`POST /api/v1/chatbot/messages` nhận `{ question, history? }`, trả `{ data: { answer, sources, warnings } }`. `GET /api/v1/chatbot/health` trả trạng thái phụ thuộc; `indexState: needs_sync` là bình thường trước lượt chat đầu hoặc sau khi nguồn thay đổi. Không có token dùng quyền khách; token sai trả 401. Không nhận role/userId từ client. Nội dung chỉ gồm catalog công khai và hướng dẫn theo vai trò; không đọc dữ liệu tài khoản riêng.

Giới hạn 2000 ký tự/câu hỏi, tối đa 10 cặp history đầu vào và 20000 ký tự; server chọn tối đa 3 cặp, 4000 ký tự. Mã nguồn chỉ có giá trị trong lượt hiện tại. Chat bị giới hạn 10 yêu cầu/phút theo tài khoản hoặc IP khách. Lỗi 502 là phản hồi model không hợp lệ, 503 là nguồn/index/Ollama chưa sẵn sàng, 504 là timeout. Xem OpenAPI và [luồng xử lý RAG](chatbot-rag.md).

Kho vector chatbot dùng PostgreSQL/Supabase qua cùng cấu hình `DB_*`: `chatbot_chunks.embedding` là `vector(1024)`, `chatbot_index_state` lưu hash/cấu hình. Chạy `node backend/scripts/migrate-chatbot.js` để chỉ áp dụng migration 004; không tự chạy các migration cũ còn pending. `node backend/scripts/index-chatbot.js` đồng bộ ngay từ catalog và hướng dẫn; chat vẫn tự đồng bộ trước retrieval. Cosine chạy bằng SQL với bộ lọc vai trò và khóa học đang hiển thị trước LIMIT. Hai bảng bật RLS và thu hồi quyền PostgREST anon/authenticated. Request/response của API không đổi.
