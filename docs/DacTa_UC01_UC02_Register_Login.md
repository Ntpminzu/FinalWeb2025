# Đặc tả Use Case (đã đồng bộ với code) — UC01 Register & UC02 Login

> Tài liệu này thay thế phần **[01] Register** và **[02] Log in** trong đặc tả cũ.
> Chỉ chỉnh 2 use case này; các use case khác giữ nguyên.
> Nội dung được viết lại để **khớp 100% với code** trên nhánh `KhanhTest` và với **sequence diagram** mới.
> Phiên bản này **đã bỏ hoàn toàn bước xác thực OTP** — đăng ký xong tạo tài khoản ngay.

---

## [01] Register (Đăng ký)

| | |
| :- | :- |
| **[01]** | **Register (Đăng ký)** |
| **Actor** | Guest |
| **Trigger** | Khi Actor chưa có tài khoản muốn tham gia vào hệ thống. |
| **Description** | Use case cho phép Actor đăng ký tài khoản Student mới. Sau khi kiểm tra dữ liệu hợp lệ, hệ thống **tạo tài khoản ngay** và chuyển Actor tới trang đăng nhập. |
| **Pre-Conditions** | Actor đang không đăng nhập. |
| **Post-Conditions** | Một tài khoản mới với `permission = STUDENT` được tạo trong CSDL; hệ thống chuyển Actor tới **trang Đăng nhập (Sign In)** kèm thông báo tạo tài khoản thành công. *(Hệ thống KHÔNG tự động đăng nhập.)* |
| **Main Flow** | *(POST /account/signup → `doSignup`)*<br>1. Actor nhấn **"Đăng ký"**; hệ thống hiển thị form đăng ký *(GET /account/signup → `showSignup`)*.<br>2. Actor nhập: Tên đăng nhập, Mật khẩu, Xác nhận mật khẩu, Họ và tên, Email, Ngày sinh; nhấn **"Đăng ký"**.<br>3. `SignupView` kiểm tra hợp lệ phía client (bắt buộc nhập, mật khẩu ≥ 6 ký tự, khớp xác nhận, email hợp lệ) và gọi AJAX `/account/is-available` để kiểm tra trùng tên đăng nhập.<br>4. Hệ thống (`doSignup`) kiểm tra email đã tồn tại chưa *(`UserDAO.findByEmail`)*.<br>5. Nếu email chưa tồn tại: hệ thống **băm mật khẩu** *(bcrypt)* và **tạo tài khoản mới** `permission = STUDENT` *(`UserDAO.register`)*.<br>6. Hệ thống chuyển Actor tới **trang Đăng nhập** với thông báo *"Account created successfully! Please sign in now."* |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 4.1. Thiếu trường bắt buộc → thông báo thiếu thông tin *(client-side SweetAlert; server-side `doSignup` cũng trả về nếu thiếu username/password/email)*.<br>4.2. Mật khẩu < 6 ký tự → *"Mật khẩu phải ít nhất 6 ký tự"* *(client-side)*.<br>4.3. Xác nhận mật khẩu không khớp → *"Mật khẩu không khớp"* *(client-side)*.<br>4.4. Email không hợp lệ (không chứa `@`) → *"Email không hợp lệ"* *(client-side)*.<br>4.5. Tên đăng nhập đã tồn tại → *"Tên đăng nhập đã tồn tại"* *(client-side, qua `/account/is-available`)*.<br>4.6. Email đã tồn tại → render lại form signup với thông báo *"Email đã tồn tại"* *(server-side, `doSignup`)*.<br>→ Các lỗi 4.1–4.6 giữ Actor tại form để nhập lại. |

**Ghi chú thay đổi so với bản cũ:**
- **Đã bỏ toàn bộ bước xác thực OTP** (sinh OTP, gửi email, nhập mã). Lý do: hệ thống chưa gửi được mail nên không thể nhập mã để sang bước tiếp theo.
- Tài khoản được tạo **ngay trong `doSignup`** sau khi dữ liệu hợp lệ, rồi chuyển về **trang Sign In**.
- Bản cũ ghi *"Bước 5: Hệ thống thực hiện Use case Login và chuyển hướng"* → đã sửa: không auto-login, chỉ chuyển về trang Sign In.
- Giữ Exception 4.5 (username trùng) và 4.6 (email trùng) cho khớp code.

---

## [02] Log in (Đăng nhập)

| | |
| :- | :- |
| **[02]** | **Log in (Đăng nhập)** |
| **Actor** | Guest |
| **Trigger** | Khi Actor muốn truy cập các chức năng yêu cầu tài khoản, hoặc nhấn nút đăng nhập, hoặc vừa đăng ký xong. |
| **Description** | Use case cho phép Actor đăng nhập vào hệ thống để sử dụng các tính năng theo quyền hạn tương ứng. |
| **Pre-Conditions** | Actor đã có tài khoản hợp lệ trên hệ thống. |
| **Post-Conditions** | Đăng nhập thành công → **session** được tạo (`isAuthenticated = true`, `authUser = user`); Actor được **chuyển hướng theo vai trò**: Student → `/student`, Instructor → `/instructor`, Admin → `/admin` *(hoặc `retUrl` / trang chủ nếu permission khác)*. |
| **Main Flow** | *(POST /account/signin → `doSignin`)*<br>1. Hệ thống hiển thị form đăng nhập *(GET /account/signin → `showSignin`)*.<br>2. Actor nhập **Username** và **Mật khẩu**, nhấn **"Sign In"**.<br>3. Hệ thống tìm user theo username *(`UserDAO.findByUsername`, dự phòng `findByName`)* và đối chiếu CSDL.<br>4. Hệ thống **so khớp mật khẩu** bằng `bcrypt.compareSync`.<br>5. Hệ thống **khởi tạo session** *(`isAuthenticated`, `authUser`)* và **điều hướng theo `permission`**. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 3.1. Thiếu username hoặc mật khẩu → trình duyệt yêu cầu nhập *(thuộc tính `required` trên form signin)*.<br>3.2. Sai username hoặc mật khẩu *(`user == null` hoặc bcrypt không khớp)* → render lại signin với thông báo *"Invalid username or password"* / *"Thông tin đăng nhập không chính xác"*.<br>3.3. Tài khoản bị khóa *(`is_disabled = true`)* → render lại signin với `disabled`, thông báo *"Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên."*<br>→ Quay lại bước 2 để nhập lại. |

**Ghi chú thay đổi so với bản cũ:**
- Post-Conditions ghi rõ **điều hướng theo vai trò** (Student/Instructor/Admin) thay vì chỉ "Homepage", cho khớp code (`switch (permission)`).
- Bổ sung bước 4 (so khớp mật khẩu bằng bcrypt) vào Main Flow.
- Làm rõ 3.1 do thuộc tính `required` ở form đảm nhiệm.
