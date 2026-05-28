# Đặc Tả 21 Use Case Cốt Lõi - Online Academy

Dưới đây là 21 bảng đặc tả cho các Use Case quan trọng nhất, được viết theo đúng template mẫu. Bạn có thể copy trực tiếp vào Word (Word sẽ tự động nhận diện định dạng bảng).

---

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[01]** | **Register (Đăng ký)** |
| **Actor** | Guest |
| **Trigger** | Khi người dùng chưa có tài khoản muốn tham gia vào hệ thống. |
| **Description** | Use case cho phép người dùng đăng ký tài khoản học viên (Student) mới. |
| **Pre-Conditions** | Người dùng đang không đăng nhập. |
| **Post-Conditions** | Hệ thống chuyển sang bước xác thực OTP, dữ liệu đăng ký được lưu tạm chờ xác thực. |
| **Main Flow** | 1. Người dùng nhấn vào nút "Đăng ký" trên giao diện.<br>2. Hệ thống hiển thị form đăng ký.<br>3. Người dùng nhập thông tin: Tên, Email, Mật khẩu và nhấn "Xác nhận".<br>4. Hệ thống kiểm tra tính hợp lệ của dữ liệu.<br>5. Hệ thống khởi tạo mã OTP và lưu tạm thời trên hệ thống kèm thời gian hết hạn.<br>6. Hệ thống tự động kích hoạt Use case **Send OTP Email**.<br>7. Hệ thống chuyển hướng người dùng đến trang xác thực OTP. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 4.a. Nếu Email đã tồn tại trong hệ thống: Hệ thống hiển thị thông báo "Email đã được sử dụng" và yêu cầu nhập lại.<br>4.b. Nếu thông tin không hợp lệ (thiếu trường, sai định dạng): Hệ thống báo lỗi tương ứng tại form và không tiếp tục. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[02]** | **Verify OTP (Xác thực OTP)** |
| **Actor** | Guest |
| **Trigger** | Hệ thống chuyển hướng người dùng sang trang xác thực sau khi hoàn thành Use case Register. |
| **Description** | Use case cho phép người dùng nhập mã OTP nhận qua email để xác thực và hoàn tất việc tạo tài khoản. |
| **Pre-Conditions** | Người dùng đã điền form đăng ký hợp lệ và OTP đã được gửi đến email. |
| **Post-Conditions** | Tài khoản mới được tạo trong hệ thống, người dùng được chuyển đến trang đăng nhập. |
| **Main Flow** | 1. Hệ thống hiển thị trang nhập mã OTP.<br>2. Người dùng nhập mã OTP 6 chữ số nhận được qua email.<br>3. Người dùng nhấn "Xác nhận".<br>4. Hệ thống đối chiếu mã OTP với dữ liệu đã lưu tạm.<br>5. Hệ thống mã hóa mật khẩu và tạo tài khoản mới trong CSDL.<br>6. Hệ thống xóa mã OTP tạm thời đã dùng.<br>7. Hệ thống chuyển hướng người dùng đến trang đăng nhập với thông báo thành công. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 4.a. Nếu mã OTP không khớp: Hệ thống thông báo "Mã OTP không đúng".<br>4.b. Nếu mã OTP đã hết hạn (quá 5 phút): Hệ thống thông báo "Mã OTP đã hết hạn" và yêu cầu đăng ký lại. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[03]** | **Log in (Đăng nhập)** |
| **Actor** | Student, Instructor, Admin |
| **Trigger** | Khi người dùng muốn truy cập vào các chức năng yêu cầu tài khoản. |
| **Description** | Use case cho phép người dùng đăng nhập vào hệ thống để sử dụng các quyền hạn tương ứng. |
| **Pre-Conditions** | Người dùng đã có tài khoản hợp lệ trên hệ thống. |
| **Post-Conditions** | Người dùng đăng nhập thành công, phiên làm việc (session) được tạo. |
| **Main Flow** | 1. Người dùng nhấn nút "Đăng nhập".<br>2. Hệ thống hiển thị form đăng nhập.<br>3. Người dùng nhập Username và Mật khẩu, nhấn "Đăng nhập".<br>4. Hệ thống xác thực thông tin đăng nhập với CSDL.<br>5. Hệ thống khởi tạo session và phân quyền dựa trên loại tài khoản (Student/Instructor/Admin).<br>6. Hệ thống chuyển hướng người dùng về trang tương ứng (Student / Instructor / Admin Dashboard). |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 4.a. Nếu sai tên đăng nhập hoặc mật khẩu: Hệ thống thông báo "Thông tin đăng nhập không chính xác".<br>4.b. Nếu tài khoản bị khóa bởi Admin: Hệ thống thông báo "Tài khoản của bạn đã bị vô hiệu hóa" và từ chối đăng nhập. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[04]** | **View Course Details (Xem chi tiết khóa học)** |
| **Actor** | Guest, Student |
| **Trigger** | Khi người dùng click vào một khóa học từ danh sách hoặc kết quả tìm kiếm. |
| **Description** | Use case cho phép xem thông tin chi tiết của một khóa học (mô tả, giảng viên, giá, đánh giá). |
| **Pre-Conditions** | Không có. |
| **Post-Conditions** | Thông tin chi tiết của khóa học được hiển thị. |
| **Main Flow** | 1. Người dùng chọn một khóa học muốn xem.<br>2. Hệ thống tăng lượt xem (view count) của khóa học.<br>3. Hệ thống truy vấn thông tin chi tiết từ CSDL (thông tin giảng viên, đánh giá, danh sách bài giảng).<br>4. Hệ thống hiển thị trang chi tiết khóa học.<br>5. (Extend) Người dùng có thể chọn **Add to Cart** hoặc **Add to Watchlist**. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 3.a. Nếu khóa học không tồn tại trong hệ thống: Hệ thống hiển thị trang lỗi "Khóa học không tồn tại hoặc không khả dụng" (Lỗi 404). |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[05]** | **Search Course (Tìm kiếm khóa học)** |
| **Actor** | Guest, Student |
| **Trigger** | Khi người dùng nhập từ khóa vào thanh tìm kiếm và nhấn tìm kiếm. |
| **Description** | Use case cho phép người dùng tìm kiếm khóa học dựa trên từ khóa theo cơ chế full-text search, hỗ trợ sắp xếp kết quả. |
| **Pre-Conditions** | Không có. |
| **Post-Conditions** | Danh sách các khóa học phù hợp với từ khóa được hiển thị. |
| **Main Flow** | 1. Người dùng nhập từ khóa tìm kiếm vào thanh search.<br>2. Người dùng nhấn nút "Tìm kiếm" hoặc phím Enter.<br>3. Hệ thống thực hiện truy vấn full-text search trong CSDL.<br>4. Hệ thống phân trang và hiển thị danh sách các khóa học trùng khớp.<br>5. Người dùng có thể chọn sắp xếp kết quả theo tiêu chí (giá, đánh giá) để thu hẹp danh sách. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 3.a. Nếu không tìm thấy khóa học nào khớp với từ khóa: Hệ thống hiển thị giao diện trống và thông báo không có kết quả phù hợp. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[06]** | **Add to Cart (Thêm vào giỏ hàng)** |
| **Actor** | Guest, Student |
| **Trigger** | Khi người dùng nhấn nút "Thêm vào giỏ hàng" tại trang chi tiết khóa học. |
| **Description** | Use case cho phép người dùng đưa một khóa học vào giỏ hàng cá nhân (lưu trong phiên làm việc) để chuẩn bị thanh toán. |
| **Pre-Conditions** | Khóa học đang ở trạng thái khả dụng. |
| **Post-Conditions** | Khóa học được thêm vào giỏ hàng trong phiên làm việc hiện tại. |
| **Main Flow** | 1. Người dùng đang ở trang chi tiết khóa học.<br>2. Người dùng nhấn "Thêm vào giỏ hàng".<br>3. Hệ thống kiểm tra xem khóa học đã có trong giỏ hàng chưa.<br>4. Hệ thống thêm khóa học vào giỏ hàng trong phiên làm việc nếu chưa tồn tại.<br>5. Hệ thống tải lại trang về vị trí hiện hành. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 3.a. Nếu khóa học đã có trong giỏ hàng: Hệ thống âm thầm bỏ qua và không thêm trùng lặp. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[07]** | **Checkout (Thanh toán)** |
| **Actor** | Student |
| **Trigger** | Khi học viên nhấn "Thanh toán" tại trang Giỏ hàng. |
| **Description** | Use case cho phép học viên mua các khóa học đang có trong giỏ hàng để sở hữu và truy cập chúng. |
| **Pre-Conditions** | Người dùng đã đăng nhập (Student) và giỏ hàng có ít nhất 1 khóa học. |
| **Post-Conditions** | Khóa học được thêm vào danh sách đã mua của học viên, giỏ hàng được làm trống. |
| **Main Flow** | 1. Học viên vào trang Giỏ hàng và nhấn "Thanh toán".<br>2. Hệ thống kiểm tra danh sách khóa học học viên đã sở hữu.<br>3. Hệ thống tự động lọc bỏ các khóa học trong giỏ mà học viên đã sở hữu.<br>4. Hệ thống lưu lịch sử giao dịch cho các khóa học hợp lệ và cấp quyền truy cập.<br>5. Hệ thống làm trống giỏ hàng.<br>6. Hệ thống chuyển hướng học viên sang trang "Khóa học của tôi". |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 1.a. Nếu người dùng là Guest nhấn thanh toán: Hệ thống tự động chuyển hướng đến trang Đăng nhập.<br>3.a. Nếu tất cả khóa học trong giỏ đều đã được học viên sở hữu: Hệ thống không ghi thêm dữ liệu và chỉ làm trống giỏ hàng. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[08]** | **Update Profile (Cập nhật hồ sơ)** |
| **Actor** | Student |
| **Trigger** | Khi học viên muốn thay đổi thông tin cá nhân. |
| **Description** | Use case cho phép học viên chỉnh sửa thông tin cá nhân gồm Tên hiển thị và Email. |
| **Pre-Conditions** | Học viên đã đăng nhập và đang ở trang Profile. |
| **Post-Conditions** | Thông tin cá nhân mới được cập nhật vào CSDL và phiên làm việc. |
| **Main Flow** | 1. Học viên truy cập trang "Hồ sơ cá nhân".<br>2. Hệ thống hiển thị form chứa thông tin hiện tại (Tên, Email).<br>3. Học viên chỉnh sửa thông tin và nhấn "Lưu thay đổi".<br>4. Hệ thống cập nhật dữ liệu vào CSDL.<br>5. Hệ thống cập nhật phiên làm việc với thông tin mới.<br>6. Hệ thống hiển thị thông báo "Cập nhật thông tin thành công". |
| **Alternate Flow** | Không có. |
| **Exception Flow** | Không có. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[09]** | **View Purchased Courses (Xem khóa học đã mua)** |
| **Actor** | Student |
| **Trigger** | Khi học viên truy cập vào mục "Khóa học của tôi" trên giao diện. |
| **Description** | Use case hiển thị danh sách các khóa học mà học viên đã mua, kèm theo tiến độ học tập của từng khóa. |
| **Pre-Conditions** | Học viên đã đăng nhập. |
| **Post-Conditions** | Danh sách khóa học đã mua được hiển thị cùng tỷ lệ hoàn thành. |
| **Main Flow** | 1. Học viên click vào menu "Khóa học của tôi".<br>2. Hệ thống truy vấn CSDL để lấy danh sách các khóa học học viên đã sở hữu.<br>3. Hệ thống tính toán tiến độ học tập (%) của từng khóa học dựa trên dữ liệu tiến độ đã lưu.<br>4. Hệ thống hiển thị danh sách khóa học lên màn hình.<br>5. Học viên có thể click vào một khóa học để bắt đầu học (chuyển sang Use case **Watch Lecture**). |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 2.a. Nếu học viên chưa mua khóa học nào: Hệ thống hiển thị thông báo "Bạn chưa sở hữu khóa học nào" kèm nút "Khám phá khóa học ngay". |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[10]** | **Watch Lecture (Xem bài giảng)** |
| **Actor** | Student |
| **Trigger** | Khi học viên click vào một bài giảng trong khóa học đã mua. |
| **Description** | Use case cho phép học viên xem video bài giảng và ghi nhận tiến độ học tập tự động. |
| **Pre-Conditions** | Học viên đã đăng nhập và đã sở hữu khóa học chứa bài giảng đó. |
| **Post-Conditions** | Bài giảng được phát, tiến độ học tập được lưu lại. |
| **Main Flow** | 1. Học viên chọn một bài giảng trong danh sách bài học của khóa học.<br>2. Hệ thống kiểm tra quyền truy cập của học viên đối với bài giảng này.<br>3. Hệ thống tải video và tiến trình học tập đã lưu trước đó của học viên.<br>4. Học viên xem video bài giảng.<br>5. Hệ thống tự động ghi nhận tiến độ (thời gian xem, phần trăm hoàn thành) qua API nền.<br>6. Khi tiến độ đạt ngưỡng 90%, hệ thống tự động đánh dấu bài giảng là "Đã hoàn thành". |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 2.a. Nếu học viên chưa mua khóa học mà cố tình truy cập link bài giảng: Hệ thống báo lỗi "Bạn không có quyền truy cập" và chuyển hướng về trang chi tiết khóa học.<br>3.a. Nếu bài giảng không tồn tại: Hệ thống hiển thị trang lỗi 404. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[11]** | **Review Course (Đánh giá khóa học)** |
| **Actor** | Student |
| **Trigger** | Khi học viên truy cập trang đánh giá của một khóa học đã mua. |
| **Description** | Use case cho phép học viên để lại nhận xét và chấm điểm (số sao từ 1-5) cho khóa học. |
| **Pre-Conditions** | Học viên đã đăng nhập, đã sở hữu khóa học và đã hoàn thành tối thiểu 1 bài giảng. |
| **Post-Conditions** | Đánh giá được lưu, điểm đánh giá trung bình của khóa học được cập nhật. |
| **Main Flow** | 1. Học viên truy cập trang đánh giá của khóa học.<br>2. Hệ thống kiểm tra điều kiện (đã mua và đã học ít nhất 1 bài).<br>3. Hệ thống hiển thị form đánh giá (số sao từ 1-5 và nội dung nhận xét).<br>4. Học viên nhập thông tin và nhấn "Gửi đánh giá".<br>5. Hệ thống lưu đánh giá vào CSDL.<br>6. Hệ thống tính toán lại điểm đánh giá trung bình của khóa học.<br>7. Hệ thống thông báo "Cảm ơn bạn đã đánh giá". |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 2.a. Nếu học viên chưa học bài giảng nào: Hệ thống chặn truy cập và thông báo điều kiện chưa đủ.<br>4.a. Nếu số sao không hợp lệ (không phải số từ 1-5): Hệ thống báo lỗi và yêu cầu nhập lại.<br>5.a. Nếu học viên đã từng đánh giá: Hệ thống ghi đè đánh giá cũ bằng đánh giá mới (cập nhật). |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[12]** | **Add to Watchlist (Thêm vào danh sách yêu thích)** |
| **Actor** | Student |
| **Trigger** | Khi học viên nhấn biểu tượng "Trái tim" tại trang danh sách hoặc chi tiết khóa học. |
| **Description** | Use case cho phép học viên lưu lại các khóa học quan tâm vào danh sách Watchlist để xem lại sau. |
| **Pre-Conditions** | Học viên đã đăng nhập. |
| **Post-Conditions** | Khóa học được liên kết với danh sách Watchlist của học viên trong CSDL. |
| **Main Flow** | 1. Học viên nhấn biểu tượng "Thêm vào yêu thích" trên một khóa học.<br>2. Hệ thống kiểm tra xem khóa học đã có trong danh sách yêu thích chưa.<br>3. Hệ thống lưu khóa học vào danh sách Watchlist của học viên.<br>4. Hệ thống tải lại trang hiện hành để xác nhận thành công. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 1.a. Nếu mã khóa học không hợp lệ: Hệ thống báo lỗi "Yêu cầu không hợp lệ".<br>2.a. Nếu khóa học đã có trong danh sách yêu thích: Hệ thống âm thầm bỏ qua, không thêm trùng lặp. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[13]** | **Create Course (Tạo khóa học)** |
| **Actor** | Instructor |
| **Trigger** | Khi giảng viên nhấn nút "Tạo khóa học mới" trên Instructor Dashboard. |
| **Description** | Use case cho phép giảng viên khởi tạo một khóa học mới bằng cách nhập thông tin mô tả, giá và tải lên ảnh thumbnail. |
| **Pre-Conditions** | Giảng viên đã đăng nhập và ở trang Instructor Dashboard. |
| **Post-Conditions** | Khóa học mới được tạo trong CSDL, gắn với tài khoản Instructor. |
| **Main Flow** | 1. Giảng viên chọn chức năng "Tạo khóa học".<br>2. Hệ thống hiển thị form tạo khóa học kèm danh sách danh mục.<br>3. Giảng viên nhập Tên, Danh mục, Giá, Giá khuyến mãi, Mô tả ngắn, Mô tả chi tiết và tải ảnh đại diện.<br>4. Giảng viên nhấn "Lưu".<br>5. Hệ thống lưu file ảnh thumbnail vào bộ nhớ server.<br>6. Hệ thống tạo khóa học trong CSDL và gán quyền sở hữu cho giảng viên.<br>7. Hệ thống chuyển hướng giảng viên về trang Instructor Dashboard. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 6.a. Nếu xảy ra lỗi trong quá trình lưu: Hệ thống thông báo lỗi và yêu cầu thử lại. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[14]** | **Manage Lectures (Quản lý bài giảng)** |
| **Actor** | Instructor |
| **Trigger** | Khi giảng viên chọn quản lý bài giảng của một khóa học từ Dashboard. |
| **Description** | Use case cho phép giảng viên xem danh sách bài giảng của khóa học và thực hiện các thao tác thêm, xóa. |
| **Pre-Conditions** | Giảng viên đã đăng nhập và là chủ sở hữu của khóa học đó. |
| **Post-Conditions** | Danh sách bài giảng được hiển thị. |
| **Main Flow** | 1. Giảng viên chọn khóa học cần quản lý bài giảng.<br>2. Hệ thống truy xuất danh sách bài giảng của khóa học đó.<br>3. Hệ thống hiển thị giao diện quản lý bài giảng.<br>4. Giảng viên có thể kích hoạt các Use Case mở rộng: **Add Lecture**, **Delete Lecture**. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 2.a. Nếu khóa học không tồn tại: Hệ thống thông báo lỗi. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[15]** | **Add Lecture (Thêm bài giảng)** |
| **Actor** | Instructor |
| **Trigger** | Khi giảng viên nhấn "Thêm bài giảng" trong giao diện Manage Lectures. |
| **Description** | Use case cho phép giảng viên thêm bài giảng mới vào khóa học bằng cách cung cấp tiêu đề và đường dẫn video. |
| **Pre-Conditions** | Giảng viên đang ở giao diện Manage Lectures của khóa học mình sở hữu. |
| **Post-Conditions** | Bài giảng mới được thêm vào khóa học và lưu trong CSDL. |
| **Main Flow** | 1. Giảng viên nhấn nút "Thêm bài giảng".<br>2. Hệ thống hiển thị form nhập thông tin.<br>3. Giảng viên nhập Tên bài giảng và Đường dẫn video (ví dụ: YouTube).<br>4. Giảng viên nhấn "Lưu".<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu.<br>6. Hệ thống lưu thông tin bài giảng vào CSDL.<br>7. Hệ thống làm mới danh sách bài giảng để hiển thị bài vừa thêm. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 5.a. Nếu thiếu tiêu đề hoặc đường dẫn video: Hệ thống báo lỗi và hủy thao tác. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[16]** | **Toggle Course Status (Thay đổi trạng thái khóa học)** |
| **Actor** | Instructor |
| **Trigger** | Khi giảng viên nhấn nút đổi trạng thái tại một khóa học trên Dashboard. |
| **Description** | Use case cho phép giảng viên bật hoặc tắt trạng thái hiển thị của khóa học trên cửa hàng. |
| **Pre-Conditions** | Giảng viên đã đăng nhập và đang ở trang Instructor Dashboard. |
| **Post-Conditions** | Trạng thái hiển thị của khóa học được đảo ngược (Bật → Tắt hoặc ngược lại). |
| **Main Flow** | 1. Giảng viên truy cập Instructor Dashboard.<br>2. Tại danh sách khóa học, giảng viên nhấn nút "Đổi trạng thái".<br>3. Hệ thống truy vấn thông tin khóa học hiện tại.<br>4. Hệ thống đảo ngược trạng thái hiển thị của khóa học trong CSDL.<br>5. Hệ thống làm mới trang Dashboard. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 3.a. Nếu khóa học không tồn tại: Hệ thống thông báo "Không tìm thấy khóa học" và báo lỗi. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[17]** | **Manage Users (Quản lý người dùng)** |
| **Actor** | Admin |
| **Trigger** | Khi Admin truy cập vào mục "Quản lý người dùng" trên Admin Dashboard. |
| **Description** | Use case cho phép Admin xem danh sách người dùng được phân theo vai trò (Student, Instructor) và thực hiện các thao tác quản lý. |
| **Pre-Conditions** | Admin đã đăng nhập. |
| **Post-Conditions** | Danh sách người dùng được hiển thị để Admin thao tác. |
| **Main Flow** | 1. Admin click vào "Quản lý người dùng".<br>2. Hệ thống truy xuất danh sách Instructor và Student từ CSDL.<br>3. Hệ thống hiển thị danh sách phân theo vai trò.<br>4. Admin có thể thực hiện các thao tác mở rộng: **Disable/Enable Account**, **Delete User**, **Promote to Instructor**. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | Không có. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[18]** | **Disable/Enable Account (Khóa/Mở khóa tài khoản)** |
| **Actor** | Admin |
| **Trigger** | Khi Admin nhấn nút "Khóa" hoặc "Mở khóa" tại một tài khoản trong Manage Users. |
| **Description** | Use case cho phép Admin vô hiệu hóa hoặc mở khóa tài khoản người dùng. |
| **Pre-Conditions** | Admin đang ở trang Manage Users. |
| **Post-Conditions** | Trạng thái truy cập của tài khoản bị thay đổi trong CSDL. |
| **Main Flow** | 1. Admin chọn tài khoản cần thay đổi trạng thái.<br>2. Admin nhấn nút "Khóa" hoặc "Mở khóa".<br>3. Hệ thống cập nhật trạng thái tài khoản trong CSDL.<br>4. Tài khoản bị khóa sẽ bị từ chối đăng nhập tại Use Case **Log in**.<br>5. Hệ thống làm mới trang quản lý. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 3.a. Nếu xảy ra lỗi khi cập nhật: Hệ thống thông báo "Không thể thay đổi trạng thái tài khoản". |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[19]** | **Manage Courses - Admin (Quản lý khóa học)** |
| **Actor** | Admin |
| **Trigger** | Khi Admin truy cập vào mục "Quản lý khóa học" trên Admin Dashboard. |
| **Description** | Use case cho phép Admin xem toàn bộ danh sách khóa học của tất cả giảng viên và thực hiện kiểm duyệt, gỡ bỏ hoặc đình chỉ khóa học vi phạm. |
| **Pre-Conditions** | Admin đã đăng nhập. |
| **Post-Conditions** | Danh sách khóa học được hiển thị để Admin thao tác. |
| **Main Flow** | 1. Admin click vào "Quản lý khóa học".<br>2. Hệ thống truy xuất toàn bộ danh sách khóa học (của tất cả giảng viên) kèm thông tin danh mục.<br>3. Hệ thống hiển thị danh sách kèm theo trạng thái.<br>4. Admin có thể kích hoạt các Use Case mở rộng: **Disable/Enable Course**, **Delete Course**. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | Không có. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[20]** | **Manage Categories (Quản lý danh mục)** |
| **Actor** | Admin |
| **Trigger** | Khi Admin truy cập vào mục "Quản lý danh mục" trên Admin Dashboard. |
| **Description** | Use case cho phép Admin xem, thêm mới, chỉnh sửa và xóa các danh mục khóa học trong hệ thống. |
| **Pre-Conditions** | Admin đã đăng nhập. |
| **Post-Conditions** | Danh sách cấu trúc danh mục được hiển thị để Admin thao tác. |
| **Main Flow** | 1. Admin click vào "Quản lý danh mục".<br>2. Hệ thống truy xuất toàn bộ danh mục từ CSDL kèm số lượng khóa học của từng danh mục.<br>3. Hệ thống hiển thị danh sách danh mục.<br>4. Admin có thể kích hoạt các Use Case mở rộng: **Add Category**, **Edit Category**, **Delete Category**. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | Không có. |

<br>

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **[21]** | **Send OTP Email (Gửi Email OTP)** |
| **Actor** | Email System |
| **Trigger** | Khi Use Case **Register** được thực hiện sau khi dữ liệu đăng ký hợp lệ. |
| **Description** | Use case cho phép hệ thống tự động tạo và gửi email chứa mã OTP xác thực tài khoản đến địa chỉ email của người dùng. |
| **Pre-Conditions** | Người dùng đã điền form đăng ký hợp lệ và mã OTP đã được hệ thống tạo ra. |
| **Post-Conditions** | Email OTP được gửi đến người dùng, mã OTP được lưu tạm thời trên hệ thống với thời hạn 5 phút. |
| **Main Flow** | 1. Hệ thống sinh ngẫu nhiên một mã OTP gồm 6 chữ số.<br>2. Hệ thống lưu mã OTP vào bộ nhớ tạm kèm theo thời gian hết hạn (5 phút).<br>3. Hệ thống soạn nội dung email chứa mã OTP.<br>4. Hệ thống (Email System / Nodemailer) gửi email đến địa chỉ email người dùng vừa đăng ký.<br>5. Hệ thống ghi nhận kết quả gửi email. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | 4.a. Nếu máy chủ mail gặp lỗi (SMTP error): Hệ thống báo lỗi "Đăng ký thất bại, vui lòng thử lại sau" và ngừng tiến trình. |

---

