# Sequence Diagram (Mermaid) — Register & Login

Bản Mermaid render trực tiếp trên GitHub, nội dung **đồng nhất** với file drawio
(`diagrams/SequenceDiagram.drawio`). Dùng để đối chiếu nhanh khi ôn tập.
Phiên bản này **không dùng OTP** — đăng ký xong tạo tài khoản ngay.

## UC01 Register — Đăng ký (`doSignup`)

```mermaid
sequenceDiagram
    actor Guest
    participant SignupView as :SignupView
    participant Ctrl as :AccountController
    participant UserDAO as :UserDAO
    participant DB as Database

    Guest->>SignupView: 1. submit form Đăng ký (username, password, confirm, name, email, dob)
    SignupView->>SignupView: 2. validate() client + checkAvailable(username) GET /account/is-available
    alt dữ liệu không hợp lệ / username trùng (Exc 4.1-4.5)
        SignupView-->>Guest: 3. cảnh báo SweetAlert, giữ nguyên form
    else dữ liệu hợp lệ
        SignupView->>Ctrl: 4. doSignup(...) POST /account/signup
        Ctrl->>UserDAO: 5. findByEmail(email)
        UserDAO->>DB: 6. execute select query
        DB-->>UserDAO: 7. return user row
        UserDAO-->>Ctrl: 8. return existsEmail
        alt email đã tồn tại (Exc 4.6)
            Ctrl-->>SignupView: 9. renderSignup(emailExist: true)
            SignupView-->>Guest: 10. hiển thị "Email đã tồn tại"
        else email chưa tồn tại
            Ctrl->>Ctrl: 11. bcrypt.hashSync(password, 10)
            Ctrl->>UserDAO: 12. register({... permission: STUDENT})
            UserDAO->>DB: 13. insert users
            DB-->>UserDAO: 14. return new user row
            UserDAO-->>Ctrl: 15. return User
            Ctrl-->>SignupView: 16. renderSignin(success: true)
            SignupView-->>Guest: 17. hiển thị trang Sign In (tạo tài khoản thành công)
        end
    end
```

## UC02 Login — Đăng nhập (`doSignin`)

```mermaid
sequenceDiagram
    actor Guest
    participant LoginView as :LoginView
    participant Ctrl as :AccountController
    participant UserDAO as :UserDAO
    participant DB as Database

    Guest->>LoginView: 1. nhập Username + Password (required)
    LoginView->>Ctrl: 2. doSignin(username, password) POST /account/signin
    Ctrl->>UserDAO: 3. findByUsername / findByName
    UserDAO->>DB: 4. execute select query
    DB-->>UserDAO: 5. return user record
    UserDAO-->>Ctrl: 6. return user
    alt user == null (Exc 3.2)
        Ctrl-->>LoginView: 7. renderSignin(error: true)
        LoginView-->>Guest: 8. "Invalid username or password"
    else is_disabled == true (Exc 3.3)
        Ctrl-->>LoginView: 9. renderSignin(error: true, disabled: true)
        LoginView-->>Guest: 10. "Tài khoản đã bị vô hiệu hóa"
    else sai mật khẩu - !compareSync (Exc 3.2)
        Ctrl-->>LoginView: 11. renderSignin(error: true)
        LoginView-->>Guest: 12. "Invalid username or password"
    else xác thực thành công
        Ctrl->>Ctrl: 13. setSession(isAuthenticated, authUser)
        Ctrl-->>LoginView: 14. redirect theo permission (1->/student, 2->/instructor, 3->/admin)
        LoginView-->>Guest: 15. tới trang chủ / dashboard
    end
```
