# FinalWeb2025 — Online Academy

Ứng dụng học trực tuyến dùng ReactJS/Vite ở `client/` và Express/JavaScript, PostgreSQL, Knex ở `backend/`. Cả hai tổ chức theo chức năng. Handlebars được giữ để đối chiếu trong giai đoạn chuyển đổi.

## Cấu trúc

```text
backend/
  src/
    modules/              auth, users, courses, categories, home, cart,
                          learning, watchlist, reviews, instructor, admin
    common/               errors, middleware, enums, schemas, utils, transaction
    config/               database, environment, paths, session, Handlebars
    routes/               ghép router API và web của các module
    app.js                tạo Express app, không mở cổng
    server.js             khởi động HTTP server
  database/{migrations,seeds}/
  scripts/
  tests/{api,unit,helpers}/
  views/                  trang Handlebars hiện tại
  static/                 tài nguyên của trang render
  uploads/                ảnh đã upload
  .env                    cấu hình backend, không commit
  package.json
client/                   ReactJS + Vite, chia theo chức năng
  src/{app,layouts,components,lib,features,styles}/
  public/                 logo, icon player và video demo
  tests/                  unit và browser E2E
docs/                     OpenAPI, hướng dẫn API, ghi chú học tập
.agents/                  skill cho dự án
graphify-out/             knowledge graph của cả repository
```

Mỗi module có các tầng cần dùng: `routes/`, `controllers/`, `services/`, `repositories/`, `domain/`, `dto/`, `schemas/`. Chỉ tạo thư mục khi có nội dung thực tế.

```text
Route → Middleware → Controller → Service → Repository → PostgreSQL
```

Controller nhận/trả HTTP. Service kiểm tra và xử lý nghiệp vụ. Repository chứa truy vấn và khóa bản ghi. DTO định dạng response; schema kiểm tra input; domain giữ model và hành vi của đối tượng. Xem [cấu trúc dự án](docs/project-structure.md).

## Cài đặt và chạy

Từ thư mục gốc, chạy `npm run install:backend` và `npm run install:client` để cài dependencies theo từng lockfile. Node.js 22.12+ được yêu cầu bởi bộ công cụ frontend hiện tại.

Để chạy ngay không cần thay đổi database thật:

```powershell
npm run dev:demo
```

Mở **http://127.0.0.1:5174**; đăng nhập `student`, `teacher` hoặc `admin`, cùng mật khẩu `Demo12345!`. Demo dùng PostgreSQL nhúng và dữ liệu tạm, mất khi tắt; không ghi Supabase.

Nếu chưa có `backend/.env`, copy `backend/.env.example` thành `backend/.env`. Điền PostgreSQL, `SESSION_SECRET`, `JWT_SECRET` (hai khóa ngẫu nhiên riêng, ít nhất 32 ký tự) và `FRONTEND_ORIGINS`. File `.env` từ cấu trúc cũ được chuyển nguyên nội dung vào backend.

```powershell
npm run dev
# Build và phục vụ React qua Express:
npm run build
npm start
```

`npm run dev` chạy React tại `localhost:5173` và backend mặc định `localhost:4000`; Vite proxy `/api` và `/uploads`. Vite tự cập nhật frontend, sửa backend cần khởi động lại lệnh. Dùng `npm run dev:backend` (watch), `npm run dev:client` ở hai terminal nếu muốn backend tự khởi động lại. `npm start` bật SPA sau khi build; `npm run start:backend` giữ cách chạy backend riêng. Xem [hướng dẫn frontend](docs/frontend.md) để cấu hình proxy, JWT/cookie và production.

`.env`, template, static, upload và migration được xác định theo vị trí backend qua `backend/src/config/paths.js`, không phụ thuộc thư mục làm việc của process. `UPLOAD_ROOT` có thể tuyệt đối hoặc tương đối với `backend/`.

## Database

`npm run db:migrate` gọi `backend/scripts/migrate.js`. Database mới chạy toàn bộ migration. Database legacy có schema nhưng chưa ghi migration gốc được kiểm tra cột rồi bỏ qua `001`, chỉ áp dụng migration mới.

Không reset hoặc seed đè database đang có dữ liệu. Các migration giữ tên khi chuyển vào `backend/database/migrations/`. Việc tổ chức lại thư mục không tự chạy migration lên Supabase. Xem [hướng dẫn API](docs/api-v1.md) trước khi triển khai database.

## Kiểm tra

```powershell
npm test
npm run build
# Sau khi cài Chromium theo docs/frontend.md:
npm run test:e2e
graphify update .
```

`check` kiểm tra cú pháp, import tương đối, ranh giới tầng và template trong cấu trúc module. Controller không import repository/database/controller khác; service không truy vấn database trực tiếp hoặc phụ thuộc Express.

`npm test` chạy backend và client unit tests. API tests dùng PostgreSQL nhúng trong bộ nhớ, session store test riêng và thư mục upload tạm, không ghi vào Supabase. OpenAPI được kiểm định và đối chiếu đệ quy với router module. Browser E2E dùng API thật trên demo, kiểm tra ba vai trò, JWT/reload/nhiều tab, giỏ/checkout/học/review, upload, CRUD, mobile và production SPA. Graphify chạy từ repository root.

## API và giao diện

Backend có 56 thao tác API dưới `/api/v1`, dùng JWT. React đã nối các màn hình public, tài khoản, học viên, giảng viên và quản trị vào API. Handlebars/session được giữ khi chạy backend riêng không bật `SERVE_CLIENT`. Migration cho JWT/cart trên database thật vẫn là bước triển khai riêng; chế độ demo đã tự tạo đầy đủ schema tạm.

- [Contract OpenAPI](docs/openapi-v1.yaml)
- [Chạy và kiểm thử React frontend](docs/frontend.md)
- [Luồng xác thực, nghiệp vụ và tích hợp frontend](docs/api-v1.md)
- [Cấu trúc module và trách nhiệm từng tầng](docs/project-structure.md)
- [Ghi chú các khái niệm backend](docs/backend-concepts-notes.md)

## Trợ lý RAG dùng Groq và Cloudflare Workers AI

Nút chat ở góc màn hình React tư vấn khóa học công khai và hướng dẫn website theo vai trò đã đăng nhập. Khách dùng hướng dẫn công khai; học viên, giảng viên và admin có thêm hướng dẫn riêng. Bot trả lời và gắn nguồn, người dùng tự thao tác ở màn hình được dẫn tới.

Chat dùng model `qwen/qwen3.8-27b` qua Groq; embedding tiếng Việt dùng `@cf/baai/bge-m3` qua Cloudflare Workers AI. Đặt `GROQ_API_KEY`, `CLOUDFLARE_ACCOUNT_ID` và `CLOUDFLARE_API_TOKEN` trong `backend/.env` khi chạy local và trong biến môi trường backend trên Render. Không đặt key trong `client/`, mã nguồn hoặc Git. Cloudflare Workers AI hiện có hạn mức miễn phí 10.000 Neurons/ngày; khi vượt mức, các request sẽ bị từ chối trên gói Free.

```powershell
npm run dev
```

Khóa học và các file `backend/knowledge/chatbot/*.md` tự đồng bộ ở lượt hỏi tiếp theo; embedding nội dung không đổi được tái dùng. Embedding được lưu trong bảng `public.chatbot_chunks` trên PostgreSQL/Supabase, cột `embedding` kiểu `vector(1024)`; cấu hình/snapshot ở `public.chatbot_index_state`. Tìm kiếm cosine và lọc vai trò chạy bằng SQL. Hai bảng bật RLS, chỉ backend truy cập bằng kết nối PostgreSQL sẵn có. Đổi embedding provider/model sẽ tạo lại vector ở lượt hỏi đầu. `backend/.env.example` liệt kê biến môi trường của chatbot. Nếu thiếu API key, các chức năng website khác vẫn hoạt động. Với database mới, áp dụng riêng migration chatbot theo `docs/chatbot-rag.md` như một bước triển khai database riêng; việc đổi frontend/backend này không tự chạy migration trên Supabase.

Hội thoại chỉ ở bộ nhớ tab; chuyển trang vẫn giữ, tải lại hoặc đổi tài khoản sẽ xóa. Giới hạn 10 yêu cầu/phút theo tài khoản hoặc IP khách. Nguồn không chứa tiến độ, lịch sử mua, dữ liệu người dùng hay thống kê riêng. Kiểm tra citation chưa bảo đảm từng ý trong đáp án đúng; cần đối chiếu nguồn.

- [Giải thích RAG, từng hàm và cách sửa hướng dẫn](docs/chatbot-rag.md).
- `node backend/scripts/chatbot-smoke.js`: smoke test với Groq/Cloudflare thật và PostgreSQL demo tạm, cần ba biến credentials và cổng 4100 trống. Kết quả JSON ghi vào thư mục tạm của hệ điều hành.
- API và browser tests dùng hai provider giả, PostgreSQL tạm và vector trong database tạm, không ghi database Supabase thật.
