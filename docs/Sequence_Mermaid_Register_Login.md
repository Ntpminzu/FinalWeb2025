# Sequence Diagram (Mermaid) — Register & Login

Bản Mermaid render trực tiếp trên GitHub, nội dung **đồng nhất** với file drawio
(`diagrams/SequenceDiagram.drawio`). Dùng để đối chiếu nhanh khi ôn tập.
Phiên bản này **không dùng OTP**; đăng ký có **validate phía server** (Controller kiểm confirm + Entity `User.validate()`) rồi mới tạo tài khoản.

## UC01 Register — Đăng ký (`doSignup`)

```mermaid
sequenceDiagram
    actor Guest
    participant SignupView as :SignupView
    participant Ctrl as :AccountController
    participant User as :User
    participant UserDAO as :UserDAO
    participant DB as Database
    Note over User: «entity» — models/user.model.js

    Guest->>SignupView: 1. submit form Đăng ký (username, password, confirm_password, name, email, dob)
    SignupView->>SignupView: 2. validate() client + checkAvailable(username) GET /account/is-available
    SignupView->>Ctrl: 3. doSignup(...) POST /account/signup
    Ctrl->>Ctrl: 4. kiểm password === confirm_password
    Ctrl->>User: 5. new User(...).validate()
    User-->>Ctrl: 6. hợp lệ / ném lỗi nếu sai
    alt confirm sai / User.validate() thất bại (Exc 4.2/4.3/4.4)
        Ctrl-->>SignupView: 7. renderSignup(message)
        SignupView-->>Guest: 8. hiển thị lỗi, giữ dữ liệu đã nhập
    else dữ liệu hợp lệ
        Ctrl->>UserDAO: 9. findByEmail(email)
        UserDAO->>DB: 10. execute select query
        DB-->>UserDAO: 11. return user row
        UserDAO-->>Ctrl: 12. return existsEmail
        alt email đã tồn tại (Exc 4.6)
            Ctrl-->>SignupView: 13. renderSignup(emailExist: true)
            SignupView-->>Guest: 14. hiển thị "Email đã tồn tại"
        else email chưa tồn tại
            Ctrl->>Ctrl: 15. bcrypt.hashSync(password, 10)
            Ctrl->>UserDAO: 16. register({... permission: STUDENT})
            UserDAO->>DB: 17. insert users
            DB-->>UserDAO: 18. return new user row
            UserDAO-->>Ctrl: 19. return User
            Ctrl-->>SignupView: 20. renderSignin(success: true)
            SignupView-->>Guest: 21. hiển thị trang Sign In (tạo tài khoản thành công)
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
