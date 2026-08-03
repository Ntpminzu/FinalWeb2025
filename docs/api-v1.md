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
/api/v1/not-found
```

Mục tiêu học:

- API public không cần auth.
- Query params phải được validate trước khi truy vấn database.
- Response thành công và lỗi nên có shape ổn định.
- Web routes cũ vẫn hoạt động song song với API routes mới.
