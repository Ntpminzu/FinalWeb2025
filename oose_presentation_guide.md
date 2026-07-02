# Hướng dẫn Báo cáo Đồ án OOSE: UC10 & UC11

Tài liệu này là kịch bản báo cáo từng bước liên kết giữa **Đặc tả Use Case** $\rightarrow$ **Sơ đồ tuần tự (Sequence Diagram)** $\rightarrow$ **Mã nguồn thực tế (Code)** $\rightarrow$ **Thao tác Demo trình duyệt** cho cả hai Use Case:
1. **UC10 - Watch Lecture (Xem bài giảng)**
2. **UC11 - Review Course (Đánh giá khóa học)**

---

## ──────────────────────────────────────────
## PHẦN A: BÁO CÁO UC10 - WATCH LECTURE (XEM BÀI GIẢNG)
## ──────────────────────────────────────────

### I. ĐẶC TẢ USE CASE UC10 CHÍNH THỨC
| Mục | Chi tiết đặc tả Use Case |
| :--- | :--- |
| **[10]** | **Watch Lecture (Xem bài giảng)** |
| **Actor** | Student |
| **Trigger** | Khi Actor nhấn vào một khóa học đã mua để bắt đầu học. |
| **Description** | Use case cho phép Actor xem video bài giảng và tài liệu học tập của một khóa học. |
| **Pre-Conditions** | Actor đã đăng nhập và đã sở hữu khóa học đó. |
| **Post-Conditions** | Bài giảng được phát, tiến độ học tập được lưu lại. |
| **Main Flow** | 1. Actor chọn một khóa học trong danh sách khóa học đã mua.<br>2. Hệ thống truy cập vào CSDL của khóa học đó.<br>3. Học viên lựa chọn bài học muốn học trong danh sách bài học của khóa học.<br>4. Hệ thống tải video và tài liệu đính kèm.<br>5. Actor xem video bài giảng.<br>6. Hệ thống tự động kích hoạt Use case **Save Progress** khi Actor xem xong hoặc đánh dấu hoàn thành.<br>7. Giao diện cập nhật trạng thái bài giảng thành "Đã hoàn thành". |
| **Alternate Flow** | Không có. |
| **Exception Flow** | **2.1.** Nếu khóa học mà Actor truy cập vào không có bài giảng khả dụng: Hệ thống hiển thị "Khóa học chưa có bài giảng." và nút "quay lại".<br>**2.1.** Actor nhấn vào nút quay lại và thực hiện bước 1. |

---

### II. KỊCH BẢN BÁO CÁO UC10 (DIAGRAM $\rightarrow$ CODE $\rightarrow$ DEMO)

#### Bước A.1: Truy cập trang danh sách bài học & Kiểm tra bài giảng (Exception 2.1)
* **Demo trên Web:** Học viên vào mục **"Khóa học đã mua"** $\rightarrow$ Click vào nút **"Vào học"** của một khóa học.
  - *Nếu khóa học trống:* Giao diện hiển thị thông báo *"Khóa học chưa có bài giảng."* và nút *"Quay lại"*.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 1 & 2: `Student` click chọn khóa học $\rightarrow$ `:LectureBoundary` gửi yêu cầu `showCourseLectures(courseId)` tới `:LectureController`.
  - Tin nhắn 3 & 6: `:LectureController` gọi `:LectureDAO: findByCourse(courseId)`.
  - `:LectureDAO` truy vấn `Database` và trả về danh sách rỗng (Tin nhắn 4 & 5).
  - Tin nhắn 7 & 8: `:LectureController` trả về trang danh sách bài học rỗng $\rightarrow$ `:LectureBoundary` kích hoạt Exception 2.1 bằng cách hiển thị thông báo *"Khóa học chưa có bài giảng."* và nút *"Quay lại"*.
* **Vị trí Code tương ứng:**
  - **Route tiếp nhận:** [student.route.js:L37](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/routes/student.route.js#L37) định nghĩa route `/student/courses/:courseId` trỏ tới `lectureController.showCourseLectures`.
  - **Xử lý Controller:** [lecture.controller.js:L11-L21](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/controllers/lecture.controller.js#L11-L21) (`showCourseLectures`) gọi `LectureDao.findByCourse(courseId)`.
  - **Truy vấn DAO:** [lecture.dao.js:L5-L16](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/daos/lecture.dao.js#L5-L16) thực hiện câu lệnh SELECT từ bảng `lectures`.
  - **Vẽ giao diện (Boundary):** [course-lectures.handlebars:L72-L78](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/views/vwStudent/course-lectures.handlebars#L72-L78):
    ```handlebars
    {{else}}
      <div class="text-muted">Khóa học chưa có bài giảng.</div>
    {{/if}}
    ```

#### Bước A.2: Chọn bài giảng, tải video & khôi phục tiến trình (Basic Flow: 3 -> 5)
* **Demo trên Web:** Học viên nhìn thấy danh sách bài học của khóa học $\rightarrow$ Click vào nút **"Vào học"** ở một bài học $\rightarrow$ Giao diện video player tải thành công bài học, tự động nhảy tới giây trước đó đang học dở.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 9a & 9b: `:LectureController` trả về danh sách bài học `renderCourseLectures(lectures)` $\rightarrow$ `:LectureBoundary` hiển thị danh sách bài học.
  - Tin nhắn 9c & 9d: `Student` chọn một bài cụ thể $\rightarrow$ `:LectureBoundary` gửi yêu cầu `getLecture(userId, courseId, lectureId)` về `:LectureController`.
  - Tin nhắn 9 & 12: `:LectureController` gọi `:LectureDAO: findById(lectureId)` để lấy metadata bài giảng.
  - Tin nhắn 13 & 16: `:LectureController` gọi `:LectureProgressDAO: find(userId, lectureId)` lấy giây xem cũ.
  - Tin nhắn 17 & 18: `:LectureController` trả về `renderLearnPage` $\rightarrow$ `:LectureBoundary` phát video và hiển thị Outline bài giảng.
* **Vị trí Code tương ứng:**
  - **Route tiếp nhận:** [student.route.js:L38](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/routes/student.route.js#L38) định nghĩa route GET `/courses/:courseId/:lectureId` trỏ tới `lectureController.getLecture`.
  - **Xử lý Controller:** [lecture.controller.js:L28-L44](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/controllers/lecture.controller.js#L28-L44) (hàm `getLecture`):
    ```javascript
    const lectures = await LectureDao.findByCourse(courseId);
    const current = await LectureDao.findById(lectureId);
    const prog = await ProgressDao.find(user.id, current.id);
    res.render('vwStudent/learn', { ... });
    ```
  - **Khôi phục ở Client (Boundary):** [learn.handlebars:L52-L58](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/views/vwStudent/learn.handlebars#L52-L58):
    ```javascript
    const lastSecond = Number('{{progress.last_second}}') || 0;
    player.on('loadedmetadata', () => {
      if (lastSecond > 0 && lastSecond < player.duration) {
        player.currentTime = lastSecond;
      }
    });
    ```

#### Bước A.3: Tự động lưu tiến độ học tập (Basic Flow: 6 -> 7)
* **Demo trên Web:** Học viên mở video lên xem, bấm tua hoặc bấm **Pause (Tạm dừng)** hoặc đóng tab. F12 Network sẽ hiển thị API gửi ngầm request POST `progress`.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 19 & 20: `Student` kết thúc/tạm dừng xem $\rightarrow$ `:LectureBoundary` gọi `saveProgress(...)` về `:LectureController`.
  - Tin nhắn 21 & 24: `:LectureController` gọi `:LectureProgressDAO: upsert(userId, lectureId, progress)`.
  - Tin nhắn 25 & 26: Trả về thành công và giao diện cập nhật lại icon/trạng thái thành "Đã hoàn thành" (nếu xem $\ge 90\%$).
* **Vị trí Code tương ứng:**
  - **Phát hiện dừng/xem xong (Boundary):** [learn.handlebars:L98-L108](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/views/vwStudent/learn.handlebars#L98-L108):
    ```javascript
    player.on('ended', () => sendProgress(true));
    player.on('pause', () => sendProgress(true));
    ```
  - **Route & Controller:** [student.route.js:L41](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/routes/student.route.js#L41) trỏ tới `lectureController.saveProgress` $\rightarrow$ xử lý tại [lecture.controller.js:L54-L68](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/controllers/lecture.controller.js#L54-L68):
    ```javascript
    const progress = new Progress({ user_id: user.id, lecture_id });
    progress.calculateProgress(last_second, duration_sec); // Logic >= 90% tại progress.model.js:L51-L57
    await ProgressDao.upsert(user.id, lecture_id, { ... }); // SQL UPDATE/INSERT tại progress.dao.js:L12-L24
    res.json({ ok: true });
    ```

---

## ──────────────────────────────────────────
## PHẦN B: BÁO CÁO UC11 - REVIEW COURSE (ĐÁNH GIÁ KHÓA HỌC)
## ──────────────────────────────────────────

### I. ĐẶC TẢ USE CASE UC11 CHÍNH THỨC
| Mục | Chi tiết đặc tả Use Case |
| :--- | :--- |
| **[11]** | **Review Course (Đánh giá khóa học)** |
| **Actor** | Student |
| **Trigger** | Khi Actor nhấn vào nút "Đánh giá khóa học" trong trang danh sách bài học của khóa học đã mua. |
| **Description** | Use case cho phép Actor đánh giá mức độ hài lòng (sao) và bình luận (comment) cho khóa học đã mua và đã bắt đầu học. |
| **Pre-Conditions** | Actor đã đăng nhập, đã sở hữu khóa học đó và đã xem ít nhất 1 bài học của khóa học. |
| **Post-Conditions** | Đánh giá được lưu lại thành công, điểm trung bình và số lượt đánh giá của khóa học được cập nhật. |
| **Main Flow** | 1. Actor nhấn vào nút "Đánh giá khóa học".<br>2. Hệ thống truy cập vào CSDL để kiểm tra trạng thái đánh giá cũ của học viên.<br>3. Hệ thống hiển thị form đánh giá trống (showEmptyForm) [Nhánh chưa đánh giá].<br>4. Actor chọn số sao (rating), nhập nhận xét (comment) và click "Gửi đánh giá".<br>5. Hệ thống lưu đánh giá mới vào CSDL.<br>6. Hệ thống tự động tính toán lại điểm đánh giá trung bình của khóa học đó.<br>7. Giao diện hiển thị thông báo cảm ơn và cập nhật hiển thị. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | **3.1. Nếu học viên đã đánh giá khóa học này trước đó:**<br>1. Hệ thống hiển thị form điền sẵn nội dung đánh giá trước đó (showExistingReview).<br>2. Actor chỉnh sửa số sao, bình luận và click "Gửi đánh giá".<br>3. Hệ thống cập nhật đánh giá cũ.<br>4. Đi tiếp bước 6 của Main Flow. |

---

### II. KỊCH BẢN BÁO CÁO UC11 (DIAGRAM $\rightarrow$ CODE $\rightarrow$ DEMO)

#### Bước B.1: Click "Đánh giá" & Kiểm tra trạng thái cũ (Main Flow 1-3 & Exception 3.1: 1)
* **Demo trên Web:** Học viên vào trang bài học của khóa học $\rightarrow$ Click vào nút **"Đánh giá khóa học"**. 
  - *Nếu chưa từng đánh giá:* Trang hiện lên một form đánh giá trống trơn (5 sao chưa chọn, ô nhận xét trống).
  - *Nếu đã đánh giá trước đó (Exception 3.1):* Form tự động điền sẵn số sao và lời bình luận cũ đã viết.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 1 & 2: `Student` click đánh giá $\rightarrow$ `:ReviewBoundary` gửi yêu cầu `checkReviewStatus(userId, courseId)` về `:ReviewController`.
  - Tin nhắn 3 & 6: `:ReviewController` gọi `:ReviewDAO: findByUserAndCourse(userId, courseId)` để tìm đánh giá cũ.
  - Tin nhắn 7 (Exception 3.1) hoặc 14 (Main Flow): `:ReviewController` trả về form chứa thông tin đánh giá cũ (`showExistingReview`) hoặc form trống (`showEmptyForm`).
* **Vị trí Code tương ứng:**
  - **Route tiếp nhận:** [student.route.js:L45](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/routes/student.route.js#L45) định nghĩa route GET `/course/:courseId/feedback` trỏ tới `reviewController.checkReviewStatus`.
  - **Xử lý Controller:** [review.controller.js:L17-L40](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/controllers/review.controller.js#L17-L40) (hàm `checkReviewStatus`):
    ```javascript
    const myFeedback = await FeedbackDao.findByUserCourse(user.id, courseId); // Tìm đánh giá cũ của học viên
    return res.render('vwStudent/feedback', { ..., myFeedback, ... });       // Render kèm thông tin đánh giá cũ (nếu có)
    ```
  - **Truy vấn DAO:** [feedback.dao.js:L5-L10](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/daos/feedback.dao.js#L5-L10) thực hiện SELECT từ bảng `feedback`.

#### Bước B.2: Điền thông tin & Click gửi (Main Flow 4-5 & Exception 3.1: 2-3)
* **Demo trên Web:** Học viên chọn lại số sao (ví dụ 4 sao), viết nội dung bình luận, rồi click vào nút **"Gửi đánh giá"**.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 8 & 9 (hoặc 15 & 16): `Student` gửi rating & comment $\rightarrow$ `:ReviewBoundary` truyền yêu cầu `submitReview(...)` hoặc `updateReview(...)` về `:ReviewController`.
  - Tin nhắn 10 & 13 (hoặc 17 & 20): `:ReviewController` gọi `:ReviewDAO` thực hiện tạo mới (`create`) hoặc cập nhật (`update`).
* **Vị trí Code tương ứng:**
  - **Route tiếp nhận:** [student.route.js:L46](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/routes/student.route.js#L46) định nghĩa POST `/course/:courseId/feedback` trỏ tới `reviewController.submitReview`.
  - **Xử lý Controller:** [review.controller.js:L47-L74](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/controllers/review.controller.js#L47-L74) (hàm `submitReview`):
    ```javascript
    // Kiểm tra tính hợp lệ và quyền đánh giá, sau đó gọi DAO thực hiện Upsert:
    await FeedbackDao.upsert(user.id, courseId, r, comment.trim());
    ```
  - **DAO xử lý cập nhật/lưu mới (Upsert):** [feedback.dao.js:L12-L29](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/daos/feedback.dao.js#L12-L29):
    ```javascript
    const existed = await FeedbackDao.findByUserCourse(userId, courseId);
    if (existed) {
      return db('feedback').where(...).update(payload); // Tương ứng update query
    }
    return db('feedback').insert({ ... });              // Tương ứng insert query
    ```

#### Bước B.3: Tính lại Rating trung bình của khóa học & Phản hồi (Flow 21-30)
* **Demo trên Web:** Sau khi nhấn nút gửi, trang web tải lại và hiển thị thông báo màu xanh *"Cảm ơn bạn đã đánh giá"*. Điểm rating trung bình và lượt đánh giá của khóa học trên giao diện chính được tự động thay đổi.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 21 đến 28: `:ReviewController` gọi `:CourseDAO: recalculateAverageRating(courseId)` $\rightarrow$ `:CourseDAO` liên hệ `:ReviewDAO` lấy điểm trung bình $\rightarrow$ update ngược lại điểm đánh giá trung bình của khóa học.
  - Tin nhắn 29 & 30: Trả về thành công và hiển thị thông báo.
* **Vị trí Code thực tế (Giải thích tối ưu hóa của nhóm):**
  - **Database Trigger tự động tính toán (Tối ưu hóa so với thiết kế):** Trong cơ sở dữ liệu thực tế, nhóm đã cài đặt một **Database Trigger** tự động trên bảng `feedback`. Bất cứ khi nào có hành động `INSERT` hoặc `UPDATE` thành công, Trigger này sẽ tự tính toán lại trung bình điểm đánh giá (`AVG(rating)`) và cập nhật thẳng vào cột `rating_avg` và `rating_count` của bảng `courses`.
  - **Chuyển hướng thông báo:** Nhờ trigger tự xử lý nên Controller chỉ cần chuyển hướng kèm cờ thành công `?ok=1` về Boundary ([review.controller.js:L73](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/controllers/review.controller.js#L73)):
    ```javascript
    return res.redirect(`/student/course/${courseId}/feedback?ok=1`);
    ```
  - **Hiển thị thông báo (Boundary):** Giao diện [feedback.handlebars:L6-L8](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/views/vwStudent/feedback.handlebars#L6-L8) phát hiện `?ok=1` và hiển thị thông báo thành công cho học viên.

---

## ──────────────────────────────────────────
## PHẦN C: BỘ CÂU HỎI PHẢN BIỆN PHỔ BIẾN (OOSE DEFENSE Q&A)
## ──────────────────────────────────────────

### Câu hỏi 1: Tại sao trong Sequence Diagram vẽ là `:ReviewController` nhưng trong Code trước đó nằm ở `student.controller.js`, và tại sao bạn lại tách nó ra?
* **Trả lời:**  
  * *"Thưa thầy/cô, ban đầu nhóm thiết kế các bộ điều khiển dựa trên **Vai trò người dùng (Role-based Controller)** nên tất cả chức năng của học viên bao gồm đánh giá nằm chung trong `student.controller.js`.*
  * *Tuy nhiên, theo đúng nguyên lý thiết kế OOSE và biểu đồ phân rã BCE (Boundary Control Entity), các tác vụ liên quan đến thực thể **Review** nên được quản lý bởi một Controller độc lập là `:ReviewController`.*
  * *Vì vậy, nhóm đã tiến hành tái cấu trúc (refactor), tách toàn bộ mã xử lý đánh giá sang tệp [review.controller.js](file:///c:/Users/GameLap/Desktop/zoo_git/FinalWeb2025/controllers/review.controller.js) riêng. Việc này giúp code modular hơn, dễ bảo trì và khớp 100% với Sơ đồ lớp cũng như Sơ đồ tuần tự UC11."*

### Câu hỏi 2: Tại sao trong sơ đồ tuần tự UC11 vẽ các bước 21-28 để tính toán Rating trung bình thủ công qua DAO, nhưng trong Code Controller của bạn lại không gọi các phương thức này?
* **Trả lời:**  
  * *"Thưa thầy/cô, trong thiết kế sơ đồ tuần tự lý thuyết, nhóm mô tả việc tính toán thủ công để thể hiện rõ thuật toán nghiệp vụ.*
  * *Tuy nhiên khi chuyển sang cài đặt thực tế, để tối ưu hóa hiệu năng hệ thống (tránh việc Server Node.js phải thực hiện nhiều truy vấn mạng liên tục làm chậm hệ thống), nhóm đã áp dụng giải pháp **Database Trigger** ở tầng Cơ sở dữ liệu.*
  * *Mỗi khi có bản ghi đánh giá được thêm hoặc cập nhật, Trigger của DB sẽ tự động tính toán lại điểm trung bình (`AVG(rating)`) và tổng lượt đánh giá, sau đó cập nhật trực tiếp vào bảng `courses`. Giải pháp này tối ưu hơn, đảm bảo tính toàn vẹn dữ liệu và giúp ứng dụng tải nhanh hơn rất nhiều."*

### Câu hỏi 3: Sự tương quan giữa `:ReviewDAO` trên sơ đồ và `FeedbackDao` trong code là gì?
* **Trả lời:**  
  * *"Dạ thưa thầy/cô, thực thể 'Review' (đánh giá) và 'Feedback' (phản hồi) trong bài toán này là một. Nhóm đặt tên bảng cơ sở dữ liệu là `feedback` và lớp truy cập dữ liệu là `FeedbackDao` để nhất quán với cách gọi của cơ sở dữ liệu gốc, nhưng về mặt thiết kế OOSE, nó đóng vai trò chính xác là `:ReviewDAO` để lưu trữ dữ liệu đánh giá của học viên."*
