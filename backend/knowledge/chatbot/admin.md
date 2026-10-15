# Hướng dẫn quản trị

## Điều hướng quản trị | /admin
Khu vực admin có tổng quan và các mục quản lý người dùng, khóa học, danh mục. Trợ lý chỉ giải thích các chức năng; không truy xuất số liệu dashboard, danh sách người dùng hoặc dữ liệu quản trị riêng.

## Quản lý người dùng | /admin/users
Admin có thể tìm và lọc người dùng, cấp quyền giảng viên cho học viên, khóa hoặc mở khóa tài khoản theo giao diện. Khóa tài khoản sẽ thu hồi các phiên đăng nhập. Không thể khóa hoặc xóa chính tài khoản admin đang sử dụng. Tài khoản có khóa học hoặc lịch sử mua không thể bị xóa.

## Quản lý khóa học | /admin/courses
Admin có thể tìm, lọc và ẩn hoặc hiện khóa học. Trong danh sách quản lý khóa học, bấm Khóa để ẩn và Mở khóa để hiện. Khóa đã có người mua vẫn có thể bị ẩn; việc ẩn không có điều kiện phải chưa có người mua. Khóa bị ẩn không xuất hiện trên catalog công khai và được loại khỏi nguồn tư vấn chatbot ở lần đồng bộ tiếp theo.

Xóa là thao tác riêng: khóa đã có người mua không thể bị xóa. Giới hạn này chỉ áp dụng cho xóa, không áp dụng cho ẩn. Trạng thái giảng viên đánh dấu khóa đã hoàn thành cũng là chức năng riêng.

## Quản lý danh mục | /admin/categories
Admin có thể thêm, sửa tên và xóa danh mục qua màn hình quản lý. Không thể xóa danh mục vẫn còn khóa học hoặc danh mục con; cần xử lý các liên kết đó trước. Trợ lý cung cấp đường dẫn để admin tự thực hiện trên giao diện.
