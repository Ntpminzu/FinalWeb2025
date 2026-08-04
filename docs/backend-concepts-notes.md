# Backend Concepts Notes

File này ghi lại các khái niệm backend quan trọng đã học trong quá trình chuyển project sang REST API. Mỗi khái niệm gồm: định nghĩa, vì sao thực tế cần, ví dụ trong project, ví dụ thực tế, lỗi thường gặp.

## REST API

REST API là cách backend expose dữ liệu/chức năng qua HTTP endpoint và trả JSON thay vì render HTML.

Trong project:

```text
Web page:  GET /courses        -> res.render(...)
REST API:  GET /api/v1/courses -> res.json(...)
```

Ví dụ thực tế:

```text
Mobile app, React app, Postman, service khác đều có thể gọi cùng API.
```

Lỗi thường gặp:

```text
Controller API trả HTML redirect hoặc render view, khiến frontend không xử lý JSON được.
```

## API Versioning

API versioning là đặt version vào URL để sau này thay đổi API mà không phá client cũ.

Trong project:

```text
/api/v1
```

Ví dụ thực tế:

```text
/api/v1/courses
/api/v2/courses
```

Lỗi thường gặp:

```text
Không version API, sau này đổi response shape làm app mobile cũ bị lỗi.
```

## Response Shape

Response shape là cấu trúc JSON thống nhất mà API trả về.

Trong project, thành công:

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

Lỗi thường gặp:

```text
Mỗi endpoint trả một kiểu JSON khác nhau, frontend phải viết nhiều nhánh xử lý.
```

## OpenAPI

OpenAPI là chuẩn mô tả REST API bằng YAML hoặc JSON.

Trong project:

```text
docs/openapi-v1.yaml
```

File này mô tả:

```text
- Method + path
- Query params
- Path params
- Request body
- Response body
- Status code
- Auth requirement
```

Ví dụ:

```text
GET /api/v1/courses?page=1&limit=12
POST /api/v1/checkout cần session cookie + x-csrf-token
```

Vì sao cần:

```text
API docs là hợp đồng giữa backend, frontend, mobile, QA và cả chính backend dev khi quay lại đọc code sau này.
```

Ví dụ thực tế:

```text
Frontend dev nhìn OpenAPI biết POST /checkout cần idempotencyKey và courseIds, không phải đoán từ code backend.
QA import OpenAPI vào Postman để test endpoint.
Backend dev dùng docs để tránh đổi response shape làm hỏng client.
```

Lỗi thường gặp:

```text
Code đã đổi nhưng docs không đổi, khiến frontend gọi sai request body hoặc xử lý thiếu status code.
```

## API Contract

API contract là lời hứa của backend với client về cách API hoạt động.

Contract gồm:

```text
- URL
- HTTP method
- Input
- Output
- Error shape
- Auth/permission requirement
```

Trong project:

```text
docs/api-v1.md          -> contract cho người đọc
docs/openapi-v1.yaml    -> contract cho tool như Swagger/Postman
```

Ví dụ:

```text
POST /api/v1/checkout
Body bắt buộc: idempotencyKey, courseIds
Thành công lần đầu: 201
Retry cùng key: 200 reused=true
Cart rỗng hoặc đã mua: 409
```

Lỗi thường gặp:

```text
Backend đổi từ courseIds sang items nhưng không báo cho frontend, làm production lỗi dù backend test vẫn pass.
```

## DTO

DTO là object được backend chuẩn hóa trước khi trả cho client.

Trong project:

```js
courseDto(course)
```

Nó đổi dữ liệu database:

```text
sale_price -> salePrice
rating_avg -> ratingAverage
```

Ví dụ thực tế:

```text
Database có password_hash, internal_note, deleted_at nhưng API không được trả các field đó.
```

Lỗi thường gặp:

```text
Trả thẳng row database ra API, leak field nhạy cảm hoặc làm client phụ thuộc schema DB.
```

## Path Params

Path params là phần biến trong URL.

Trong project:

```text
GET /api/v1/courses/:id
```

Khi gọi:

```text
GET /api/v1/courses/1
```

Express đọc:

```js
req.params.id
```

Lỗi thường gặp:

```text
Không validate id, để "abc" đi xuống database query.
```

## Query Params

Query params là dữ liệu sau dấu `?` trong URL.

Trong project:

```text
GET /api/v1/courses?q=node&categoryId=2&sort=rating_desc&page=1&limit=12
```

Express đọc:

```js
req.query
```

Lỗi thường gặp:

```text
Tin tưởng query params từ client, không validate sort/page/limit.
```

## Pagination

Pagination là chia danh sách thành nhiều trang để API không trả quá nhiều dữ liệu một lần.

Trong project:

```text
page=1
limit=12
```

Backend tính:

```text
offset = (page - 1) * limit
```

Ví dụ thực tế:

```text
Danh sách có 100000 khóa học thì không thể trả hết trong một response.
```

Lỗi thường gặp:

```text
Không giới hạn limit, client gửi limit=100000 làm database/server quá tải.
```

## Limit Clamping

Limit clamping là giới hạn `limit` tối đa dù client gửi số lớn.

Trong project:

```js
apiPagination(query, 12, 50)
```

Nghĩa là:

```text
default limit = 12
max limit = 50
```

Ví dụ thực tế:

```text
Client gửi limit=999, backend chỉ cho limit=50.
```

Lỗi thường gặp:

```text
Cho client toàn quyền chọn limit, dễ bị abuse hoặc query chậm.
```

## Search, Filter, Sort

Search tìm theo keyword, filter giới hạn theo điều kiện, sort sắp xếp kết quả.

Trong project:

```text
q=node
categoryId=2
sort=rating_desc
```

Ví dụ thực tế:

```text
User tìm "node", chọn category Backend, sort theo rating cao nhất.
```

Lỗi thường gặp:

```text
Không whitelist sort, client truyền field lạ hoặc gây query nguy hiểm.
```

## Protected Resource

Protected resource là endpoint chỉ user đã đăng nhập mới được truy cập.

Trong project:

```text
GET /api/v1/auth/me
GET /api/v1/cart
```

Middleware:

```js
requireApiUser
```

Ví dụ thực tế:

```text
Ai cũng xem được course list, nhưng chỉ user hiện tại xem được cart/profile của chính mình.
```

Lỗi thường gặp:

```text
Quên middleware auth ở endpoint trả dữ liệu cá nhân.
```

## Current User Scope With /me

`/me` là pattern API dùng để truy cập dữ liệu của user đang đăng nhập.

Trong project:

```text
GET /api/v1/me/courses
GET /api/v1/me/courses/:courseId/progress
```

Backend lấy user từ session:

```js
req.user.id
```

Thay vì để client truyền:

```text
GET /api/v1/users/:userId/courses
```

Vì sao cần:

```text
Client không được tự quyết định userId khi đọc dữ liệu cá nhân. Backend phải lấy userId từ session/token đã xác thực.
```

Ví dụ thực tế:

```text
App ngân hàng thường có /me/accounts thay vì /users/123/accounts, để tránh user đổi URL xem tài khoản người khác.
```

Lỗi thường gặp:

```text
Dùng userId từ params/body cho dữ liệu cá nhân mà không kiểm tra ownership.
```

## Ownership Check

Ownership check là kiểm tra user hiện tại có quyền truy cập resource cụ thể hay không.

Trong project:

```text
GET /api/v1/me/courses/:courseId/progress
```

Service kiểm tra:

```js
PurchasedDao.findByUserAndCourse(userId, courseId)
```

Nếu user chưa mua course:

```text
403 Forbidden
```

Vì sao cần:

```text
Dù URL có courseId hợp lệ, backend vẫn phải kiểm tra course đó có thuộc quyền truy cập của user hiện tại không.
```

Ví dụ thực tế:

```text
User có thể đoán /courses/4/progress, nhưng nếu chưa mua course 4 thì không được xem bài giảng.
```

Lỗi thường gặp:

```text
Chỉ check user đã login mà quên check user có sở hữu resource đang truy cập hay không.
```

## Role-Based Authorization

Role-based authorization là kiểm tra user đã đăng nhập có đúng vai trò để gọi endpoint hay không.

Trong project:

```text
requireApiUser     -> chỉ cần đăng nhập
requireApiStudent  -> phải là student
requireApiInstructor -> phải là instructor
requireApiAdmin    -> phải là admin
```

Ví dụ endpoint student:

```text
GET /api/v1/cart
POST /api/v1/checkout
PATCH /api/v1/me/lectures/:lectureId/progress
POST /api/v1/courses/:courseId/reviews
```

Các endpoint này dùng:

```js
requireApiStudent
```

Vì sao cần:

```text
Đăng nhập chỉ trả lời "bạn là ai".
Role authorization trả lời "bạn được phép làm việc này không".
```

Ví dụ thực tế:

```text
Student được học và checkout.
Instructor được quản lý khóa học của họ.
Admin được khóa/mở tài khoản.
Ba người đều đã login, nhưng quyền thao tác khác nhau.
```

Lỗi thường gặp:

```text
Chỉ dùng middleware check login cho mọi endpoint, khiến user role khác có thể gọi nhầm API không dành cho họ.
```

## Authentication vs Authorization

Authentication là xác thực danh tính: hệ thống biết request này thuộc user nào.

Authorization là phân quyền: user đó có được phép làm hành động này trên resource này không.

Trong project:

```text
Authentication:
- Đọc session cookie
- Lấy req.session.authUser.id
- Load user từ database
- Gán req.user

Authorization:
- Check permission student/instructor/admin
- Check ownership đã mua course chưa
```

Ví dụ:

```text
Chưa login gọi /api/v1/cart -> 401 Unauthorized
Login bằng instructor nhưng gọi /api/v1/cart -> 403 Forbidden
Login bằng student nhưng xem course chưa mua -> 403 Forbidden
```

Lỗi thường gặp:

```text
Nghĩ rằng login rồi là được làm mọi thứ.
```

## PATCH Method

`PATCH` dùng để cập nhật một phần resource.

Trong project:

```text
PATCH /api/v1/me/lectures/:lectureId/progress
PATCH /api/v1/courses/:courseId/reviews/me
```

Body chỉ gửi phần cần đổi:

```json
{
  "lastSecond": 120
}
```

Vì sao dùng PATCH:

```text
Client không thay toàn bộ lecture progress object, chỉ cập nhật vị trí xem hiện tại.
```

Ví dụ thực tế:

```text
PATCH /me/profile chỉ đổi name
PATCH /orders/1 chỉ đổi status
PATCH /lectures/5/progress chỉ đổi lastSecond
PATCH /courses/1/reviews/me chỉ sửa review của chính user hiện tại
```

Lỗi thường gặp:

```text
Dùng POST cho mọi cập nhật, làm API khó hiểu ngữ nghĩa.
```

## Upsert

Upsert là thao tác "insert nếu chưa có, update nếu đã có".

Trong project:

```text
POST /api/v1/courses/:courseId/reviews
```

Service gọi:

```js
FeedbackDao.upsert(userId, courseId, rating, comment)
```

Vì bảng `feedback` có unique:

```text
user_id + course_id
```

mỗi user chỉ có một review cho một course.

Ví dụ thực tế:

```text
User đánh giá course lần đầu -> insert
User sửa đánh giá cũ -> update
```

Lỗi thường gặp:

```text
Không có unique constraint, user có thể tạo nhiều review cho cùng một course.
```

## POST vs PATCH Strict Semantics

Strict semantics nghĩa là mỗi HTTP method giữ vai trò rõ ràng.

Trong project:

```text
POST /api/v1/courses/:courseId/reviews
```

dùng để tạo review mới.

```text
PATCH /api/v1/courses/:courseId/reviews/me
```

dùng để cập nhật review đã tồn tại của user hiện tại.

Status code:

```text
POST tạo thành công -> 201 Created
POST khi review đã tồn tại -> 409 Conflict
PATCH update thành công -> 200 OK
PATCH khi chưa có review -> 404 Not Found
```

So với upsert:

```text
Upsert tiện hơn nhưng ít rõ ý định.
Strict semantics rõ hơn cho frontend, tester và API docs.
```

Lỗi thường gặp:

```text
Dùng POST cho cả tạo và sửa mà không document rõ, khiến client không biết khi nào resource mới được tạo.
```

## 401 Unauthorized vs 403 Forbidden

`401 Unauthorized` nghĩa là chưa đăng nhập hoặc không có credential hợp lệ.

`403 Forbidden` nghĩa là đã đăng nhập nhưng không đủ quyền hoặc không được phép làm hành động đó.

Ví dụ:

```text
Chưa login gọi /api/v1/cart -> 401
Student gọi API chỉ admin được dùng -> 403
```

Lỗi thường gặp:

```text
Dùng 403 cho cả chưa đăng nhập, khiến frontend không biết có nên mở màn login hay không.
```

## Session Cookie

Session cookie là cookie chứa session id. Dữ liệu session thật nằm ở server/session store.

Trong project:

```text
Cookie: online_academy.sid
Session store: PostgreSQL qua connect-pg-simple
```

Session có thể chứa:

```js
{
  isAuthenticated: true,
  authUser: { id: 1, username: 'student1' },
  cart: []
}
```

Lỗi thường gặp:

```text
Hiểu nhầm rằng cookie chứa toàn bộ user/session data.
```

## CSRF

CSRF là tấn công giả mạo request từ website khác, lợi dụng browser tự gửi session cookie.

Flow trong project:

```text
GET /api/v1/auth/csrf-token
POST /api/v1/auth/login với header x-csrf-token
```

Vì sao cần:

```text
Session cookie được browser tự gửi, nên POST/PATCH/DELETE cần thêm csrfToken do frontend chủ động gửi.
```

Ví dụ thực tế:

```text
Trang xấu có thể khiến browser gửi POST checkout, nhưng không biết x-csrf-token hợp lệ.
```

Lỗi thường gặp:

```text
Dùng session cookie cho API nhưng bỏ CSRF ở state-changing request.
```

## State-Changing Request

State-changing request là request làm thay đổi trạng thái hệ thống.

Ví dụ:

```text
POST /api/v1/cart/items
DELETE /api/v1/cart/items/1
POST /api/v1/checkout
POST /api/v1/auth/logout
```

Các request này cần CSRF khi dùng session cookie.

Lỗi thường gặp:

```text
Nghĩ rằng chỉ checkout/payment mới cần bảo vệ, trong khi logout/update/delete cũng là thay đổi state.
```

## Session Regeneration

Session regeneration là tạo session id mới sau thời điểm nhạy cảm, thường là sau login/register.

Trong project:

```js
req.session.regenerate(...)
```

Vì sao cần:

```text
Chống session fixation, tức attacker cố định session id trước rồi lợi dụng sau khi user login.
```

Ví dụ thực tế:

```text
Trước khi xác minh danh tính bạn có số thứ tự tạm; sau khi xác minh, hệ thống cấp mã phiên mới an toàn hơn.
```

Lỗi thường gặp:

```text
Login xong vẫn giữ session id cũ.
```

## 201 Created

`201 Created` dùng khi request tạo resource mới thành công.

Trong project:

```text
POST /api/v1/auth/register -> 201 Created
POST /api/v1/checkout lần đầu -> 201 Created
```

Ví dụ thực tế:

```text
Tạo user, tạo order, tạo course, tạo review mới.
```

Lỗi thường gặp:

```text
Mọi request đều trả 200, làm client không biết action vừa tạo mới resource.
```

## 204 No Content

`204 No Content` dùng khi request thành công nhưng không cần response body.

Trong project:

```text
POST /api/v1/auth/logout -> 204 No Content
```

Ví dụ thực tế:

```text
Logout, delete item, mark notification as read.
```

Lỗi thường gặp:

```text
Trả body thừa sau thao tác không cần dữ liệu.
```

## 409 Conflict

`409 Conflict` nghĩa là request hợp lệ nhưng trạng thái hiện tại không cho phép thực hiện.

Trong project:

```text
Checkout cart rỗng -> 409
Checkout course đã sở hữu -> 409
```

Ví dụ thực tế:

```text
Username đã tồn tại, sản phẩm hết hàng, đơn hàng đã thanh toán rồi nhưng client gửi thanh toán lại.
```

Lỗi thường gặp:

```text
Trả 500 cho lỗi nghiệp vụ hoặc trả 200 dù thao tác không thực sự hoàn tất.
```

## Database Transaction

Database transaction gom nhiều query thành một khối an toàn.

Nguyên tắc:

```text
Tất cả thành công -> commit
Có lỗi -> rollback
```

Trong project:

```js
db.transaction(async trx => {
  const owned = await PurchasedDao.findOwnedCourseIds(userId, trx);
  await PurchasedDao.addMultiple(userId, cart.items, trx);
});
```

Ví dụ thực tế:

```text
Chuyển khoản: trừ tiền A, cộng tiền B, ghi lịch sử. Nếu một bước lỗi thì rollback toàn bộ.
```

Lỗi thường gặp:

```text
Mở transaction trong service nhưng DAO vẫn dùng db global thay vì trx.
```

## All-Or-Nothing Business Rule

All-or-nothing nghĩa là nghiệp vụ hoặc thành công toàn bộ, hoặc thất bại toàn bộ.

Trong project:

```text
Nếu cart có course đã sở hữu, checkout trả 409 và không mua một phần.
```

Ví dụ thực tế:

```text
Đơn hàng có một sản phẩm hết hàng thì hệ thống không tự ý giao các sản phẩm còn lại nếu chưa hỏi user.
```

Lỗi thường gặp:

```text
Checkout âm thầm mua một phần, user tưởng thanh toán toàn bộ thành công.
```

## Idempotency

Idempotency nghĩa là cùng một request được gửi nhiều lần nhưng backend không xử lý lặp thành nhiều giao dịch.

Trong project:

```text
POST /api/v1/checkout
Body: { "idempotencyKey": "abc123" }
```

Nếu key mới:

```json
{
  "data": {
    "purchased": 2,
    "reused": false
  }
}
```

Status code:

```text
201 Created
```

Nếu gửi lại cùng key:

```json
{
  "data": {
    "purchased": 2,
    "reused": true
  }
}
```

Status code:

```text
200 OK
```

Ví dụ thực tế:

```text
Mạng lag sau checkout, frontend retry cùng idempotencyKey, backend trả lại kết quả cũ thay vì checkout lần nữa.
```

Lỗi thường gặp:

```text
Double-click hoặc retry tạo nhiều order/payment.
```

## Request Fingerprint For Idempotency

Request fingerprint là dấu vân tay của request dùng để kiểm tra cùng một `idempotencyKey` có thật sự đại diện cho cùng một hành động không.

Trong project:

```text
fingerprint = user id + courseIds client gửi trong checkout request
```

Ví dụ:

```text
user:1|courses:1,2,3
```

Nếu request retry cùng key và fingerprint giống nhau:

```text
Trả lại response cũ với reused=true
```

Nếu request dùng cùng key nhưng fingerprint khác:

```text
409 Conflict
```

Vì sao không lấy fingerprint từ cart hiện tại trong session:

```text
Sau checkout thành công, cart bị clear. Nếu retry cùng key mà fingerprint lấy từ cart hiện tại, backend sẽ thấy fingerprint khác và trả 409 sai. Vì vậy checkout request cần gửi courseIds như snapshot của hành động ban đầu.
```

Ví dụ thực tế:

```text
Payment key abc dùng cho charge 100000 thì không được dùng lại cho charge 500000.
```

Lỗi thường gặp:

```text
Chỉ kiểm tra key đã tồn tại mà không kiểm tra request có cùng nội dung hay không.
```

## Database-Backed Idempotency

Database-backed idempotency lưu idempotency key vào bảng riêng thay vì session.

Trong project:

```text
idempotency_keys
- user_id
- endpoint
- idempotency_key
- request_fingerprint
- status_code
- response_body
```

Vì sao cần:

```text
Session có thể hết hạn, phình to, hoặc khó debug. Database có unique constraint và query lịch sử rõ hơn.
```

Flow:

```text
1. Check key trong DB
2. Nếu có và fingerprint giống -> replay response
3. Nếu có và fingerprint khác -> 409
4. Nếu chưa có -> checkout trong transaction
5. Lưu response vào idempotency_keys
6. Commit
```

Lỗi thường gặp:

```text
Check key ngoài transaction rồi checkout/lưu key sau, dễ gặp race condition khi hai request cùng key đến cùng lúc.
```

## Integration Test

Integration test kiểm tra cả luồng API thay vì chỉ một function nhỏ.

Trong project:

```text
HTTP request -> route -> middleware -> controller -> service -> response
```

Dùng `supertest` để test Express app mà không cần chạy server thật:

```js
const response = await request(app).get('/api/v1/health');
```

Vì sao cần:

```text
Unit test có thể pass nhưng route quên middleware auth/CSRF vẫn là lỗi bảo mật. Integration test bắt được lỗi nối tầng như vậy.
```

Ví dụ đang test:

```text
GET /api/v1/health -> 200
GET /api/v1/not-found -> 404 JSON
GET /api/v1/auth/me chưa login -> 401
POST /api/v1/auth/login thiếu CSRF -> 403
```

Lỗi thường gặp:

```text
Chỉ test service/validator, không test route thật nên không phát hiện redirect HTML hoặc thiếu middleware ở API.
```

## Operational Error

Operational error là lỗi nghiệp vụ hoặc lỗi dự kiến, có status code và message rõ ràng.

Trong project:

```js
throw new UnauthorizedError('Bạn cần đăng nhập để tiếp tục.');
throw new ConflictError('Giỏ hàng đang trống.');
```

Các lỗi này kế thừa `AppError`, và có:

```js
isOperational = true
```

Ví dụ:

```text
400 ValidationError
401 UnauthorizedError
403 ForbiddenError
404 NotFoundError
409 ConflictError
```

Vì sao cần:

```text
Backend phân biệt lỗi nghiệp vụ expected với bug thật như TypeError hoặc database crash.
```

Lỗi thường gặp:

```text
Log stack trace cho mọi lỗi 401/403/404/409 làm test output và production logs bị nhiễu.
```

## Test Hygiene

Test hygiene là giữ output test sạch để lỗi thật nổi bật.

Trong project:

```js
if (process.env.NODE_ENV !== 'test' || !error.isOperational) {
  console.error(error);
}
```

Nghĩa là:

```text
Trong test, operational errors như 401/403 expected không in stack trace.
Bug thật vẫn được log.
Ngoài test, backend vẫn log như bình thường.
```

Ví dụ:

```text
Integration test cố tình gọi /api/v1/auth/me khi chưa login.
Backend trả 401 đúng như kỳ vọng.
Không cần in stack trace UnauthorizedError trong test output.
```

Lỗi thường gặp:

```text
Test pass nhưng terminal đầy lỗi expected, khiến team dễ bỏ qua lỗi thật.
```

## Transaction vs Idempotency

Hai khái niệm này dễ nhầm nhưng giải quyết hai vấn đề khác nhau.

Transaction trả lời:

```text
Một lần xử lý có bị ghi dữ liệu nửa vời không?
```

Idempotency trả lời:

```text
Cùng một hành động bị gửi lại nhiều lần thì backend có xử lý lặp không?
```

So sánh:

```text
Transaction:
- Chạy bên trong database operation.
- Bảo vệ consistency của một lần checkout.
- Rollback nếu query giữa chừng lỗi.

Idempotency:
- Chạy ở tầng API/business workflow.
- Bảo vệ khi client retry/double-click.
- Trả lại kết quả cũ hoặc tránh xử lý lặp.
```

Ví dụ không có idempotency:

```text
Request 1 checkout thành công nhưng response mất.
Request 2 retry.
Transaction đảm bảo request 2 không ghi nửa vời, nhưng backend có thể trả 409 vì course đã mua.
Frontend tưởng checkout fail dù thực tế đã thành công.
```

Ví dụ có idempotency:

```text
Request 1 checkout thành công nhưng response mất.
Request 2 retry cùng idempotencyKey.
Backend trả lại kết quả thành công cũ với reused=true.
Frontend hiểu checkout đã thành công.
```

Kết luận:

```text
Checkout/payment thực tế thường cần cả Transaction và Idempotency.
```
