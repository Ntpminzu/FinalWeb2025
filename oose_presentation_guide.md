# Hướng dẫn Báo cáo Đồ án OOSE: UC07 & UC08

Tài liệu này là kịch bản báo cáo từng bước liên kết giữa **Đặc tả Use Case** $\rightarrow$ **Sơ đồ tuần tự (Sequence Diagram)** $\rightarrow$ **Mã nguồn thực tế (Code)** $\rightarrow$ **Thao tác Demo trình duyệt** cho cả hai Use Case:
1. **UC07 - View Courses by Category (Xem khóa học qua danh mục)**
2. **UC08 - Filter Courses (Lọc khóa học)**

---

## PHẦN A: BÁO CÁO UC07 - VIEW COURSES BY CATEGORY

### I. ĐẶC TẢ USE CASE UC07 CHÍNH THỨC

| Mục | Chi tiết đặc tả Use Case |
| :--- | :--- |
| **[07]** | **View Courses by Category (Xem khóa học qua danh mục)** |
| **Actor** | Guest |
| **Trigger** | Khi Actor nhấn vào bất kỳ danh mục nào tại cửa sổ danh mục. |
| **Description** | Use case cho phép Actor xem danh sách các khóa học theo đúng loại danh mục đã chọn. |
| **Pre-Conditions** | Không có. |
| **Post-Conditions** | Danh sách các khóa học phù hợp với danh mục được hiển thị. |
| **Main Flow** | 1. Actor nhấn chọn tại cửa sổ danh mục “Khám phá”.<br>2. Hệ thống hiện bảng danh mục hiện có theo dạng danh sách sổ xuống.<br>3. Actor nhấn chọn vào một trong các danh mục.<br>4. Hệ thống truy xuất lấy dữ liệu các khóa học liên quan.<br>5. Hệ thống đưa Actor đến trang danh sách các khóa học liên quan đến danh mục đã chọn. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | Không có. |

### II. KỊCH BẢN BÁO CÁO UC07 (DIAGRAM $\rightarrow$ CODE $\rightarrow$ DEMO)

#### Bước A.1: Mở menu “Khám phá” và hiển thị danh mục

* **Demo trên Web:** Tại thanh điều hướng, Guest nhấn vào menu **“Khám phá”**. Hệ thống xổ xuống danh sách danh mục cha và danh mục con.
* **Tương ứng trên Sequence Diagram:** [UC07_ViewCoursesByCategory_SimpleBCE_Sequence.drawio](diagrams/UC07_ViewCoursesByCategory_SimpleBCE_Sequence.drawio)
  - Tin nhắn 1: `Guest` click **"Khám phá"** vào `:CategoryBoundary`.
  - Tin nhắn 2: `:CategoryBoundary` hiển thị danh sách danh mục dạng dropdown.
* **Vị trí Code tương ứng:**
  - **Middleware nạp danh mục cho header:** [app.js](app.js) gọi `CategoryDao.all()` và gán vào `res.locals.categories`:
    ```javascript
    const categories = await CategoryDao.all();
    res.locals.categories = categories;
    ```
  - **DAO lấy danh mục cha - con:** [category.dao.js](daos/category.dao.js) có hàm `CategoryDao.all()` đọc bảng `categories` và gom cây danh mục.
  - **Boundary hiển thị dropdown:** [main.handlebars](views/layouts/main.handlebars) duyệt `{{#each categories}}` và tạo link `/categories/{{this.id}}`.

#### Bước A.2: Guest chọn một danh mục

* **Demo trên Web:** Guest chọn một danh mục bất kỳ trong menu **“Khám phá”**, ví dụ một danh mục con. Trình duyệt chuyển đến URL dạng:
  ```text
  /categories/:id
  ```
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 3: `Guest` chọn `category(categoryId)`.
  - Tin nhắn 4: `:CategoryBoundary` gửi request `GET /categories/:id` đến `:CategoryController`.
  - Tin nhắn 5: `:CategoryController` thực thi `showByCategory(categoryId)`.
* **Vị trí Code tương ứng:**
  - **Gắn router:** [app.js](app.js)
    ```javascript
    app.use('/categories', categoryRoute);
    ```
  - **Route tiếp nhận:** [category.route.js](routes/category.route.js)
    ```javascript
    router.get('/:id', categoryController.showByCategory);
    ```
  - **Controller xử lý:** [category.controller.js](controllers/category.controller.js) có hàm `showByCategory(req, res, next)`.

#### Bước A.3: Hệ thống truy xuất dữ liệu khóa học theo danh mục

* **Demo trên Web:** Sau khi chọn danh mục, hệ thống lấy các khóa học thuộc danh mục đó. Nếu danh mục được chọn là danh mục cha, hệ thống lấy thêm khóa học thuộc các danh mục con.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 6-8: `:CategoryController` gọi `:CategoryDAO.findById(categoryId)` để kiểm tra danh mục tồn tại.
  - Tin nhắn 9-11: `:CategoryController` gọi `:CategoryDAO.findChildIds(categoryId)` để lấy các danh mục con.
  - Tin nhắn 12: Controller tạo `allCategoryIds = [categoryId, ...childIds]`.
  - Tin nhắn 13-16: `:CategoryController` gọi `:CourseDAO.findPageByCategoryIds(allCategoryIds, limit, offset)` để lấy danh sách khóa học.
  - Tin nhắn 17-18: `:CategoryController` gọi `:CourseDAO.countByCategoryIds(allCategoryIds)` để tính tổng số khóa học phục vụ phân trang.
* **Vị trí Code tương ứng:**
  - **Tạo danh sách id danh mục:** [category.controller.js](controllers/category.controller.js)
    ```javascript
    const category = await CategoryDao.findById(parentCategoryId);
    const childIds = await CategoryDao.findChildIds(parentCategoryId);
    const allCategoryIds = [parentCategoryId, ...childIds];
    ```
  - **Lấy khóa học và tổng số khóa học:** [category.controller.js](controllers/category.controller.js)
    ```javascript
    const [courses, totalCourses] = await Promise.all([
      CourseDao.findPageByCategoryIds(allCategoryIds, limit, offset),
      CourseDao.countByCategoryIds(allCategoryIds)
    ]);
    ```
  - **DAO tìm danh mục con:** [category.dao.js](daos/category.dao.js)
    ```javascript
    static async findChildIds(parentId) {
      const children = await db('categories')
        .where('parent_id', parentId)
        .select('id');
      return children.map(child => child.id);
    }
    ```
  - **DAO lấy khóa học theo danh mục:** [course.dao.js](daos/course.dao.js)
    ```javascript
    static findPageByCategoryIds(idArray, limit, offset) {
      return db('courses as c')
        .where('c.is_disabled', false)
        .whereIn('c.category_id', idArray)
        .orderBy('c.id', 'desc')
        .limit(limit)
        .offset(offset);
    }
    ```

#### Bước A.4: Hiển thị trang danh sách khóa học theo danh mục

* **Demo trên Web:** Trang hiển thị tiêu đề **“Các khóa học thuộc lĩnh vực: ...”** và danh sách khóa học dạng card. Mỗi card có ảnh, tên khóa học, rating, giá, nút thêm vào giỏ và nút xem chi tiết.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 19: `:CategoryController` trả dữ liệu `render byCategory(category, courses, pagination)` về `:CategoryBoundary`.
  - Tin nhắn 20: `:CategoryBoundary` hiển thị danh sách khóa học cho `Guest`.
* **Vị trí Code tương ứng:**
  - **Render view:** [category.controller.js](controllers/category.controller.js)
    ```javascript
    res.render('vwCourse/byCategory', {
      layout: 'main',
      category: category,
      courses: courses,
      empty: courses.length === 0,
      pagination: {
        totalPages: totalPages,
        currentPage: page,
        queryString: null
      }
    });
    ```
  - **Boundary hiển thị danh sách khóa học:** [byCategory.handlebars](views/vwCourse/byCategory.handlebars)
    ```handlebars
    <h2>
        Các khóa học thuộc lĩnh vực:
        <span class="text-primary">{{category.catname}}</span>
    </h2>

    {{#each courses}}
      <div class="card h-100 shadow-sm">
        <img src="{{this.thumbnail}}" class="card-img-top" alt="{{this.title}}">
        <h5 class="card-title text-truncate">{{this.title}}</h5>
      </div>
    {{/each}}
    ```

---

## PHẦN B: BÁO CÁO UC08 - FILTER COURSES

### I. ĐẶC TẢ USE CASE UC08 CHÍNH THỨC

| Mục | Chi tiết đặc tả Use Case |
| :--- | :--- |
| **[08]** | **Filter Courses (Lọc khóa học)** |
| **Actor** | Guest |
| **Trigger** | Khi Actor truy cập vào mục “Liên quan nhất (Mặc định)”. |
| **Description** | Use case hiển thị danh sách các khóa học theo bộ lọc mà Actor đã chọn. |
| **Pre-Conditions** | Actor đã sử dụng công cụ tìm kiếm (thanh search). |
| **Post-Conditions** | Danh sách khóa học đã được sắp xếp theo bộ lọc được hiển thị. |
| **Main Flow** | 1. Actor nhấn vào bộ lọc trình đơn thả xuống có chữ “Liên quan nhất (Mặc định)”.<br>2. Hệ thống hiển thị menu các bộ lọc.<br>3. Hệ thống thực hiện sắp xếp các khóa học theo bộ lọc.<br>4. Hệ thống hiển thị danh sách khóa học đã được sắp xếp lên màn hình. |
| **Alternate Flow** | Không có. |
| **Exception Flow** | Không có. |

### II. KỊCH BẢN BÁO CÁO UC08 (DIAGRAM $\rightarrow$ CODE $\rightarrow$ DEMO)

#### Bước B.1: Guest tìm kiếm khóa học trước khi lọc

* **Demo trên Web:** Guest nhập từ khóa vào thanh search, ví dụ `node`, rồi nhấn biểu tượng tìm kiếm. Hệ thống chuyển đến:
  ```text
  /search?q=node
  ```
* **Tương ứng trên Sequence Diagram:** [UC08_FilterCourses_SimpleBCE_Sequence.drawio](diagrams/UC08_FilterCourses_SimpleBCE_Sequence.drawio)
  - Ghi chú pre-condition: `Guest` đã sử dụng thanh search và đang ở trang `/search?q=...`.
  - Đây là điều kiện trước của UC08, vì bộ lọc chỉ xuất hiện sau khi đã có kết quả tìm kiếm.
* **Vị trí Code tương ứng:**
  - **Form search trong layout:** [main.handlebars](views/layouts/main.handlebars)
    ```handlebars
    <form class="d-flex flex-grow-1 mx-3 navbar-search" role="search" action="/search" method="get">
      <input class="form-control" type="search" name="q" placeholder="Tìm kiếm khóa học">
    </form>
    ```
  - **Gắn router search:** [app.js](app.js)
    ```javascript
    app.use('/search', searchRouter);
    ```
  - **Route tiếp nhận:** [search.route.js](routes/search.route.js)
    ```javascript
    router.get('/', searchController.search);
    ```

#### Bước B.2: Mở dropdown “Liên quan nhất (Mặc định)”

* **Demo trên Web:** Tại trang kết quả tìm kiếm, Guest nhấn dropdown **“Liên quan nhất (Mặc định)”**. Hệ thống hiển thị các lựa chọn:
  ```text
  Liên quan nhất (Mặc định)
  Điểm đánh giá giảm dần
  Giá tăng dần
  ```
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 1: `Guest` click dropdown **"Liên quan nhất (Mặc định)"** vào `:SearchBoundary`.
  - Tin nhắn 2: `:SearchBoundary` hiển thị menu bộ lọc.
* **Vị trí Code tương ứng:**
  - **Boundary dropdown filter:** [search.handlebars](views/vwCourse/search.handlebars)
    ```handlebars
    <select class="form-select" name="sort" id="sortSelect" onchange="this.form.submit()">
      <option value="default">Liên quan nhất (Mặc định)</option>
      <option value="rating_desc">Điểm đánh giá giảm dần</option>
      <option value="price_asc">Giá tăng dần</option>
    </select>
    ```

#### Bước B.3: Guest chọn một bộ lọc và form tự gửi request

* **Demo trên Web:** Guest chọn **“Điểm đánh giá giảm dần”** hoặc **“Giá tăng dần”**. Form tự submit, URL trở thành:
  ```text
  /search?q=node&sort=rating_desc
  ```
  hoặc:
  ```text
  /search?q=node&sort=price_asc
  ```
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 3: `Guest` chọn `filter(sortOption)`.
  - Tin nhắn 4: `:SearchBoundary` tự submit form với `q` và `sort`.
  - Tin nhắn 5: `:SearchBoundary` gửi `GET /search?q=query&sort=sortOption` đến `:SearchController`.
  - Tin nhắn 6: `:SearchController` chạy `search(req.query.q, req.query.sort)`.
* **Vị trí Code tương ứng:**
  - **Giữ lại từ khóa khi lọc:** [search.handlebars](views/vwCourse/search.handlebars)
    ```handlebars
    <input type="hidden" name="q" value="{{query}}">
    ```
  - **Tự submit khi đổi filter:** [search.handlebars](views/vwCourse/search.handlebars)
    ```handlebars
    <select class="form-select" name="sort" id="sortSelect" onchange="this.form.submit()">
    ```
  - **Controller đọc query và sort:** [search.controller.js](controllers/search.controller.js)
    ```javascript
    const query = req.query.q || '';
    const sortOption = req.query.sort || 'default';
    ```

#### Bước B.4: Hệ thống sắp xếp danh sách khóa học theo bộ lọc

* **Demo trên Web:** Khi chọn **“Điểm đánh giá giảm dần”**, các khóa học có `rating_avg` cao hơn được đưa lên trước. Khi chọn **“Giá tăng dần”**, khóa học có giá thấp hơn được đưa lên trước. Nếu để mặc định, hệ thống sắp xếp theo độ liên quan với từ khóa.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 7: `:SearchController` gọi `:CourseDAO.findPageByFTS(query, sortOption, limit, offset)`.
  - Tin nhắn 8: `:CourseDAO` làm sạch từ khóa bằng `sanitizeFTS(query)`.
  - Tin nhắn 9-11: `:CourseDAO` truy vấn `Database`, áp dụng `ORDER BY` theo `sortOption`, rồi trả về danh sách khóa học đã sắp xếp.
  - Tin nhắn 12-13: `:SearchController` gọi `:CourseDAO.countByFTS(query)` để tính tổng kết quả cho phân trang.
* **Vị trí Code tương ứng:**
  - **Controller gọi DAO:** [search.controller.js](controllers/search.controller.js)
    ```javascript
    const [courses, totalCourses] = await Promise.all([
      CourseDao.findPageByFTS(query, sortOption, limit, offset),
      CourseDao.countByFTS(query)
    ]);
    ```
  - **DAO tìm kiếm và sắp xếp:** [course.dao.js](daos/course.dao.js)
    ```javascript
    switch (sortOption) {
      case 'price_asc':
        query.orderBy('c.price', 'asc');
        break;
      case 'rating_desc':
        query.orderBy('c.rating_avg', 'desc');
        break;
      default:
        query.orderBy('rank', 'desc');
        break;
    }
    ```

#### Bước B.5: Hiển thị danh sách khóa học đã lọc

* **Demo trên Web:** Trang kết quả tìm kiếm tải lại và hiển thị danh sách khóa học theo đúng bộ lọc vừa chọn. Dropdown vẫn giữ trạng thái filter hiện tại.
* **Tương ứng trên Sequence Diagram:**
  - Tin nhắn 14: `:SearchController` trả về `render search(query, sort, courses, pagination)` cho `:SearchBoundary`.
  - Tin nhắn 15: `:SearchBoundary` hiển thị danh sách khóa học đã lọc cho `Guest`.
* **Vị trí Code tương ứng:**
  - **Render trang search:** [search.controller.js](controllers/search.controller.js)
    ```javascript
    res.render('vwCourse/search', {
      layout: 'main',
      query: query,
      sort: sortOption,
      courses: courses,
      empty: courses.length === 0,
      pagination: {
        totalPages: totalPages,
        currentPage: page,
        queryString: queryString
      }
    });
    ```
  - **Boundary hiển thị khóa học:** [search.handlebars](views/vwCourse/search.handlebars)
    ```handlebars
    {{#each courses}}
      <div class="card shadow-sm h-100 border-0">
        <img src="{{this.thumbnail}}" class="card-img-top" alt="{{this.title}}">
        <h5 class="card-title text-truncate">{{this.title}}</h5>
        <p class="card-text text-muted small">{{this.category}}</p>
      </div>
    {{/each}}
    ```

---

## PHẦN C: GỢI Ý LỜI NÓI KHI BÁO CÁO

### Câu nói chuyển từ Use Case sang Sequence Diagram

* **UC07:** “Từ đặc tả UC07, Actor chỉ cần chọn danh mục ở menu Khám phá. Vì vậy trong sequence diagram, em dùng `:CategoryBoundary` để đại diện cho giao diện menu và trang danh mục, `:CategoryController` để xử lý request, còn `:CategoryDAO` và `:CourseDAO` là tầng truy xuất dữ liệu.”
* **UC08:** “UC08 có pre-condition là người dùng đã tìm kiếm trước. Vì vậy sequence diagram bắt đầu tại trang `/search?q=...`, sau đó Actor chọn dropdown filter, Boundary tự submit form và Controller truyền `sortOption` xuống DAO để thay đổi cách `ORDER BY`.”

### Câu hỏi phản biện thường gặp

#### Câu hỏi 1: Tại sao UC07 có cả `CategoryDAO` và `CourseDAO`?

* **Trả lời:** “Vì hệ thống cần xử lý hai loại dữ liệu khác nhau. `CategoryDAO` dùng để kiểm tra danh mục được chọn và lấy danh mục con. Sau đó `CourseDAO` mới dùng danh sách id danh mục để lấy các khóa học tương ứng.”

#### Câu hỏi 2: Tại sao UC08 không có `FilterController` riêng?

* **Trả lời:** “Filter là một phần của chức năng Search Course. Trong code thực tế, bộ lọc chỉ thay đổi tham số `sort` của trang `/search`, nên nhóm xử lý trong `SearchController` để tránh tách controller không cần thiết.”

#### Câu hỏi 3: Bộ lọc trong UC08 được xử lý ở frontend hay backend?

* **Trả lời:** “Frontend chỉ hiển thị dropdown và submit form. Việc sắp xếp thật sự nằm ở backend, cụ thể là trong `CourseDao.findPageByFTS()`, nơi hệ thống chọn `ORDER BY rank`, `ORDER BY rating_avg desc`, hoặc `ORDER BY price asc`.”
