# Hướng dẫn Demo & Vấn đáp — UC01 Register & UC02 Login

Tài liệu giúp bạn **demo web** khớp từng bước của sequence diagram và **chỉ đúng dòng code** tương ứng, để tự tin bảo vệ trước giảng viên.

> Phiên bản này **đã bỏ hoàn toàn OTP**: đăng ký hợp lệ là tạo tài khoản ngay rồi chuyển sang trang đăng nhập.

Mọi đường dẫn file tính từ thư mục gốc dự án (`FinalWeb2025/`).

---

## 0. Kiến trúc tổng quan (mô hình BCE)

Dự án theo mô hình **MVC + DAO**, ánh xạ sang **Boundary – Control – Entity**:

| Vai trò BCE | Thành phần trong code | File |
| :- | :- | :- |
| **Boundary** (giao diện) | `SignupView`, `LoginView` | `views/vwAccount/signup.handlebars`, `signin.handlebars` |
| **Control** (điều khiển) | `AccountController` | `controllers/account.controller.js` |
| **Entity/DAO** (truy xuất dữ liệu) | `UserDAO` | `daos/user.dao.js` |
| **Entity** (đối tượng) | `User`, `Permission` | `models/user.model.js`, `enums/Permission.js` |
| **Database** | PostgreSQL (Supabase) qua Knex | `utils/db.js` |

**Luồng request tiêu biểu:** `Trình duyệt → routes/account.route.js → controllers/account.controller.js → daos/user.dao.js → utils/db.js (Postgres) → render views/vwAccount/*.handlebars`.

Router `/account` được gắn tại `app.js:211` (`app.use('/account', accountRouter)`).

---

## 1. Chuẩn bị & chạy web để demo

> ✅ Đã kiểm tra: server khởi động in ra `✅ Server is running at http://localhost:4000`.

1. Mở terminal tại thư mục `FinalWeb2025/`.
2. (Nếu chưa có `node_modules`) chạy: `npm install`
3. Chạy server:
   - Chạy thường: `node app.js` (hoặc `npm start`)
   - Chạy dev tự reload: `npm run dev` (nodemon)
4. Mở trình duyệt: **http://localhost:4000**
   - Trang đăng ký: **http://localhost:4000/account/signup**
   - Trang đăng nhập: **http://localhost:4000/account/signin**

**Về CSDL:** kết nối sẵn tới PostgreSQL trên Supabase (cấu hình cứng trong `utils/db.js`) → **không cần cài DB local**.

**Không còn OTP:** đăng ký hợp lệ sẽ tạo tài khoản ngay và chuyển sang trang đăng nhập — không cần mở mail, không cần nhập mã.

---

## 2. UC01 — Register (Đăng ký, không OTP)

### Kịch bản demo (nói + thao tác)

1. Vào `/account/signup`, nhập: tên đăng nhập, mật khẩu, xác nhận mật khẩu, họ tên, email, ngày sinh → nhấn **Đăng ký**.
2. (Demo lỗi trước) thử: bỏ trống trường / mật khẩu < 6 ký tự / xác nhận sai / email không có `@` / trùng username → SweetAlert báo lỗi, chưa gửi form.
3. (Demo lỗi email trùng) nhập email đã tồn tại → trang signup báo "Email đã tồn tại".
4. Nhập hợp lệ → tài khoản được tạo trong CSDL → **chuyển thẳng về trang Sign In** với banner *"Account created successfully!"*.

### 2.1 — Ánh xạ từng mũi tên trên sequence ("UC01 Register") → code

`POST /account/signup` → `doSignup`:

| # (sequence) | Ý nghĩa | Nơi thấy trên web | Code (file:line) |
| :- | :- | :- | :- |
| 1 | Guest submit form đăng ký | Form ở trang `/account/signup` | `views/vwAccount/signup.handlebars:93` (`<form action="/account/signup">`) |
| 2 | `SignupView` validate phía client (bắt buộc, ≥6, khớp confirm, email hợp lệ, check trùng username) | Cảnh báo SweetAlert khi nhập sai | `signup.handlebars:10-83` (hàm `handleSubmit`); check trùng username qua `fetch('/account/is-available')` dòng `61` → `controllers/account.controller.js:101` (`checkAvailable`), route `routes/account.route.js:14` |
| 3 | Báo lỗi & giữ form (nhánh không hợp lệ) | Popup lỗi, ở lại signup | `signup.handlebars:20,30,40,50,64` (các `Swal.fire`) |
| 4 | `doSignup(username, password, email, name, dob)` | Sau khi submit hợp lệ | Route `routes/account.route.js:11`; hàm `controllers/account.controller.js:50` |
| 5 | `findByEmail(email)` | (ngầm phía server) | `controllers/account.controller.js:67` → `daos/user.dao.js:79` |
| 6 | execute select query | | `daos/user.dao.js:80` |
| 7 | return user row | | `daos/user.dao.js:81` |
| 8 | return existsEmail | | biến `existsEmail` tại `controllers/account.controller.js:67` |
| 9 | `renderSignup(emailExist: true)` (nhánh email đã tồn tại) | Signup báo "Email đã tồn tại" | `controllers/account.controller.js:69` |
| 10 | show "Email đã tồn tại" | Thông báo trên form | render kèm cờ `emailExist` (dùng trong `signup.handlebars`) |
| 11 | `bcrypt.hashSync(password, 10)` (nhánh email chưa tồn tại) | (ngầm) | `controllers/account.controller.js:73` |
| 12 | `register({... permission: STUDENT})` | | `controllers/account.controller.js:76-84` → `daos/user.dao.js:6` |
| 13 | execute insert query (bảng `users`) | Dòng user mới trong DB | `daos/user.dao.js:8-16` |
| 14–15 | return new user / User | | `daos/user.dao.js:17` |
| 16 | `renderSignin(success: true)` | | `controllers/account.controller.js:87` |
| 17 | Hiển thị trang Sign In (tạo TK thành công) | Banner xanh "Account created successfully!" | `views/vwAccount/signin.handlebars:16-21` (khối `{{#if success}}`) |

**Kiểm chứng "tài khoản đã được tạo trong CSDL":** sau khi đăng ký, mở bảng `users` trên Supabase → thấy dòng mới với `permission = 1` (STUDENT). Đối chiếu enum tại `enums/Permission.js:12`. Mật khẩu đã được băm bằng bcrypt (`controllers/account.controller.js:73`), không lưu plaintext.

---

## 3. UC02 — Login (Đăng nhập)

### Kịch bản demo

1. Vào `/account/signin`, nhập Username + Password → nhấn **Sign In**.
2. (Demo lỗi) nhập sai mật khẩu → banner "Invalid username or password".
3. (Demo lỗi) đăng nhập bằng tài khoản bị khóa (`is_disabled = true`) → banner "Tài khoản đã bị vô hiệu hóa".
4. Đăng nhập đúng → tạo session → chuyển hướng theo vai trò (Student → `/student`).

### 3.1 — Ánh xạ trang "UC02 Login" → code (`POST /account/signin` → `doSignin`)

| # (sequence) | Ý nghĩa | Nơi thấy trên web | Code (file:line) |
| :- | :- | :- | :- |
| 1 | Nhập Username + Password (required) | Form `/account/signin` | `views/vwAccount/signin.handlebars:1`; ô nhập `required` tại `:26` và `:32` |
| 2 | `doSignin(username, password)` | | Route `routes/account.route.js:18`; hàm `controllers/account.controller.js:139` |
| 3 | `findByUsername(username)` / `findByName(username)` | | `controllers/account.controller.js:144-147` → `daos/user.dao.js:24` và `:29` |
| 4 | execute select query | | `daos/user.dao.js:25` |
| 5–6 | return user record / user | | `daos/user.dao.js:26` |
| 7 | `renderSignin(error: true)` — nhánh user == null | Banner vàng lỗi | `controllers/account.controller.js:150-152` |
| 8 | show "Invalid username or password" | | `views/vwAccount/signin.handlebars:9-14` (`{{else if error}}`) |
| 9 | `renderSignin(error, disabled)` — nhánh tài khoản khóa | Banner đỏ | `controllers/account.controller.js:155-160` |
| 10 | show "Tài khoản đã bị vô hiệu hóa..." | | `views/vwAccount/signin.handlebars:5-8` (`{{#if disabled}}`) |
| 11 | `renderSignin(error: true)` — nhánh sai mật khẩu | Banner vàng lỗi | `controllers/account.controller.js:163-166` (`bcrypt.compareSync`) |
| 12 | show "Invalid username or password" | | `signin.handlebars:9-14` |
| 13 | `setSession(...)` — nhánh thành công | (ngầm) | `controllers/account.controller.js:169-170` (`req.session.isAuthenticated`, `authUser`) |
| 14 | redirect theo `permission` (1→/student, 2→/instructor, 3→/admin) | Chuyển trang | `controllers/account.controller.js:172-181` (`switch`) |
| 15 | Chuyển hướng tới trang chủ / dashboard | Trang student/instructor/admin | các route `/student`, `/instructor`, `/admin` |

**Session được đọc lại ở đâu:** middleware `app.js:151-170` đọc `req.session.authUser` để set `res.locals.authUser`; middleware bảo vệ trang tại `middlewares/auth.mdw.js:1` (`restrict`).

---

## 4. Bảng file quan trọng cần thuộc

| Chức năng | Route | Controller | DAO | View |
| :- | :- | :- | :- | :- |
| Hiện form đăng ký | `account.route.js:10` | `showSignup` `:32` | — | `signup.handlebars` |
| Xử lý đăng ký + tạo user | `account.route.js:11` | `doSignup` `:50` | `user.dao.js:79`, `user.dao.js:6` | `signin.handlebars` |
| Kiểm tra trùng username | `account.route.js:14` | `checkAvailable` `:101` | `user.dao.js:24,29` | (AJAX, không render) |
| Hiện form đăng nhập | `account.route.js:17` | `showSignin` `:122` | — | `signin.handlebars` |
| Xử lý đăng nhập | `account.route.js:18` | `doSignin` `:139` | `user.dao.js:24,29` | `signin.handlebars` / redirect |

---

## 5. Câu hỏi vấn đáp thường gặp (kèm gợi ý trả lời)

**Q1. Luồng đăng ký hoạt động thế nào?**
Một request duy nhất `POST /account/signup` → `doSignup`: kiểm tra thiếu trường (`:59`), kiểm tra email trùng (`:67`), băm mật khẩu (`:73`), tạo user permission STUDENT (`:76`), rồi render trang Sign In với cờ `success` (`:87`). Không có bước OTP.

**Q2. Mật khẩu được bảo vệ ra sao?**
Không lưu plaintext: băm bằng **bcrypt** (`bcryptjs`) `hashSync(password, 10)` khi tạo user (`account.controller.js:73`); khi đăng nhập so khớp bằng `compareSync` (`:163`).

**Q3. Phân quyền hoạt động thế nào?**
Dựa vào enum `Permission` (`enums/Permission.js`: STUDENT=1, INSTRUCTOR=2, ADMIN=3). Tài khoản đăng ký mới mặc định STUDENT (`account.controller.js:82`). Khi đăng nhập, `switch(permission)` điều hướng (`:172-181`). Các middleware `restrictStudent/Instructor/Admin` (`auth.mdw.js`) chặn truy cập theo quyền.

**Q4. Kiểm tra dữ liệu (validation) nằm ở client hay server?**
Chủ yếu **client-side** trong `signup.handlebars` (độ dài mật khẩu, khớp xác nhận, định dạng email, trùng username qua `/account/is-available`). Server-side `doSignup` kiểm tra thiếu username/password/email (`:59`) và **email trùng** (`:67`). Vì vậy trong sequence, bước "validate" đặt ở Boundary (`SignupView`).

**Q5. Session lưu gì và cấu hình ở đâu?**
`express-session` cấu hình ở `app.js:37-42`. Khi đăng nhập lưu `req.session.isAuthenticated = true` và `req.session.authUser = user` (`account.controller.js:169-170`). Middleware `app.js:151-170` nạp lại vào `res.locals` cho mọi trang.

**Q6. Đăng nhập bằng username hay email?**
Bằng **username** (dự phòng tìm theo `name`): `findByUsername || findByName` (`account.controller.js:144-147`).

**Q7. Vì sao sau đăng ký không tự đăng nhập luôn?**
Thiết kế hiện tại chuyển về trang Sign In kèm thông báo thành công (`account.controller.js:87` → `signin.handlebars:16`) để người dùng chủ động đăng nhập.

**Q8. Nếu thầy hỏi "trước đây có OTP không?"**
Trả lời thẳng: hệ thống từng thiết kế xác thực OTP qua email, nhưng do phần gửi mail chưa hoạt động ổn định (không nhận được mã) nên nhóm đã **lược bỏ bước OTP** để luồng đăng ký chạy thông suốt; tài khoản được tạo ngay sau khi dữ liệu hợp lệ. Đặc tả và sequence đã cập nhật đồng bộ.

**Q9. Điểm nào có thể cải tiến?** *(chủ động nêu để ghi điểm)*
- Nên bổ sung validation phía server cho độ dài mật khẩu/khớp xác nhận (hiện chỉ có client) để chống bypass.
- `utils/db.js` đang hardcode credentials → nên đưa vào biến môi trường `.env`.
- `req.session.authUser` đang lưu cả hash mật khẩu → nên loại bỏ trước khi lưu session.
- Có thể thêm lại xác thực email (OTP) khi cấu hình được dịch vụ gửi mail thật.

---

## 6. Sơ đồ quan hệ 3 tài liệu (để nói khi mở bài)

> "Ba tài liệu đã được đồng bộ: **Đặc tả** mô tả *cái gì*; **Sequence diagram** mô tả *trình tự tương tác giữa các đối tượng*; **Code** là *hiện thực*. Với 2 use case Register và Login, mỗi mũi tên trên sequence đều ánh xạ tới một dòng code cụ thể (bảng ở mục 2 và 3), và mọi nhánh ngoại lệ trong đặc tả đều xuất hiện trong sequence dưới dạng khung `alt`."

- Đặc tả đã sửa: `docs/DacTa_UC01_UC02_Register_Login.md`
- Sequence (bản gộp 2 trang): `diagrams/SequenceDiagram.drawio`
- Sequence từng UC: `diagrams/UC01_Register_SimpleBCE_Sequence.drawio`, `diagrams/UC02_Login_SimpleBCE_Sequence.drawio`
- Bản Mermaid (render trên GitHub): `docs/Sequence_Mermaid_Register_Login.md`
