# REST API v1

API v1 đang chạy song song với server-rendered pages dưới prefix:

```text
/api/v1
```

Web pages trả HTML bằng `res.render(...)`. REST API trả JSON bằng `res.json(...)`.

## Response Shape

Thành công:

```json
{
  "data": {}
}
```

Danh sách có phân trang:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "totalPages": 9
  }
}
```

Lỗi:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Không tìm thấy tài nguyên.",
    "status": 404
  }
}
```

## Endpoints

### Health Check

```http
GET /api/v1/health
```

Dùng để kiểm tra API server còn chạy.

### List Courses

```http
GET /api/v1/courses
```

Query params:

```text
page       positive integer, default 1
limit      positive integer, default 12, max 50
q          keyword search, optional
categoryId positive integer, optional
sort       relevance | newest | popular | rating_desc | price_asc | price_desc
```

Ví dụ:

```http
GET /api/v1/courses?page=1&limit=12
GET /api/v1/courses?q=node&sort=relevance
GET /api/v1/courses?q=node&categoryId=2&sort=rating_desc
```

### Course Detail

```http
GET /api/v1/courses/:id
```

Ví dụ:

```http
GET /api/v1/courses/1
```

Nếu `id` không hợp lệ, API trả `400`. Nếu không tìm thấy khóa học, API trả `404`.

### List Categories

```http
GET /api/v1/categories
```

Trả danh sách category dạng cây.

### List Courses By Category

```http
GET /api/v1/categories/:id/courses
```

Query params:

```text
page  positive integer, default 1
limit positive integer, default 12, max 50
```

Ví dụ:

```http
GET /api/v1/categories/1/courses?page=1&limit=12
```

### Current User

```http
GET /api/v1/auth/csrf-token
```

Trả CSRF token của session hiện tại. Với các request API dùng `POST`, `PATCH`, `PUT`, `DELETE`, gửi token này qua header:

```http
x-csrf-token: token
```

```http
POST /api/v1/auth/register
```

Body:

```json
{
  "username": "new.student",
  "password": "password123",
  "confirmPassword": "password123",
  "name": "New Student",
  "email": "student@example.com",
  "dob": "2000-01-01"
}
```

Header bắt buộc:

```http
x-csrf-token: token
```

Nếu tạo user thành công, API trả `201 Created` và lưu user vào session.

```http
POST /api/v1/auth/login
```

Body:

```json
{
  "username": "student1",
  "password": "password123"
}
```

Header bắt buộc:

```http
x-csrf-token: token
```

Nếu đăng nhập thành công, server lưu user vào session và trả thông tin user.

```http
POST /api/v1/auth/logout
```

Header bắt buộc:

```http
x-csrf-token: token
```

Nếu đăng xuất thành công, API trả `204 No Content`.

```http
GET /api/v1/auth/me
```

Trả thông tin user đang đăng nhập bằng session cookie.

Nếu chưa đăng nhập, API trả `401` thay vì redirect sang trang login.

### Cart

```http
GET /api/v1/cart
```

Trả giỏ hàng đang lưu trong session của user hiện tại.

Nếu chưa đăng nhập, API trả `401`.

```http
POST /api/v1/cart/items
```

Body:

```json
{
  "courseId": 1
}
```

Header bắt buộc:

```http
x-csrf-token: token
```

Thêm course vào giỏ hàng trong session và trả lại cart mới.

```http
DELETE /api/v1/cart/items/:courseId
```

Header bắt buộc:

```http
x-csrf-token: token
```

Xóa course khỏi giỏ hàng trong session và trả lại cart mới.

```http
DELETE /api/v1/cart
```

Header bắt buộc:

```http
x-csrf-token: token
```

Xóa toàn bộ cart trong session và trả lại cart rỗng.

```http
POST /api/v1/checkout
```

Header bắt buộc:

```http
x-csrf-token: token
```

Mua các khóa học hiện có trong cart, ghi vào bảng `purchased`, rồi clear cart trong session.

Checkout thành công lần đầu trả `201 Created`.

Nếu cart rỗng, API trả `409 Conflict`.

Nếu cart có khóa học user đã sở hữu, API trả `409 Conflict` và không mua một phần.

Body:

```json
{
  "idempotencyKey": "client-generated-unique-key",
  "courseIds": [1, 2]
}
```

`courseIds` là snapshot danh sách course trong cart tại lúc user bấm checkout. Backend dùng nó để tạo request fingerprint ổn định.

Nếu gửi lại cùng `idempotencyKey` và cùng `courseIds`, API không checkout lần hai mà trả lại kết quả cũ với `200 OK` và `reused: true`.

Nếu gửi cùng `idempotencyKey` nhưng `courseIds` khác, API trả `409 Conflict`.

### My Learning

```http
GET /api/v1/me/courses
```

Trả danh sách khóa học user hiện tại đã mua, kèm phần trăm hoàn thành.

Nếu chưa đăng nhập, API trả `401`.

```http
GET /api/v1/me/courses/:courseId/progress
```

Trả danh sách lecture và feedback của course cụ thể nếu user hiện tại đã sở hữu course đó.

Nếu chưa đăng nhập, API trả `401`. Nếu chưa sở hữu course, API trả `403`.

```http
PATCH /api/v1/me/lectures/:lectureId/progress
```

Body:

```json
{
  "lastSecond": 120
}
```

Header bắt buộc:

```http
x-csrf-token: token
```

Cập nhật tiến độ xem bài giảng. Nếu lecture không thuộc course user đã mua, API trả `403`.

### Reviews

```http
POST /api/v1/courses/:courseId/reviews
```

Body:

```json
{
  "rating": 5,
  "comment": "Khóa học dễ hiểu"
}
```

Header bắt buộc:

```http
x-csrf-token: token
```

Tạo review của user hiện tại cho course. User phải sở hữu course và đã học ít nhất một lecture.

Nếu tạo thành công, API trả `201 Created`. Nếu user đã có review cho course này, API trả `409 Conflict`.

```http
PATCH /api/v1/courses/:courseId/reviews/me
```

Body:

```json
{
  "rating": 4,
  "comment": "Sau khi học lại tôi thấy cần bổ sung thêm ví dụ"
}
```

Header bắt buộc:

```http
x-csrf-token: token
```

Cập nhật review của user hiện tại cho course. Nếu user chưa có review cho course này, API trả `404 Not Found`.

## Manual Test Ideas

Thử các URL này trong browser, Postman hoặc curl:

```text
/api/v1/health
/api/v1/courses
/api/v1/courses?page=1&limit=999
/api/v1/courses?q=node&sort=rating_desc
/api/v1/courses?categoryId=abc
/api/v1/courses/abc
/api/v1/courses/999999
/api/v1/categories
/api/v1/categories/1/courses
/api/v1/auth/csrf-token
/api/v1/auth/register
/api/v1/auth/login
/api/v1/auth/logout
/api/v1/auth/me
/api/v1/me/courses
/api/v1/me/courses/1/progress
/api/v1/me/lectures/1/progress
/api/v1/courses/1/reviews
/api/v1/courses/1/reviews/me
/api/v1/cart
/api/v1/cart/items
/api/v1/cart/items/1
/api/v1/checkout
/api/v1/not-found
```

Mục tiêu học:

- API public không cần auth.
- Query params phải được validate trước khi truy vấn database.
- Response thành công và lỗi nên có shape ổn định.
- Web routes cũ vẫn hoạt động song song với API routes mới.

## API Tests

Chạy integration tests cho các API nền tảng:

```bash
npm run test:api
```

Hoặc chạy toàn bộ:

```bash
npm test
```
