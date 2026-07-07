/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Course — Class Diagram                            ║
 * ║                                                              ║
 * ║  Tương đương @Entity @Table("courses") trong Spring Boot     ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - id: int              (PK, auto-increment)               ║
 * ║    - instructor_id: int   (FK → users.id)                    ║
 * ║    - category_id: int     (FK → categories.id)               ║
 * ║    - title: string        (not null)                          ║
 * ║    - short_desc: string                                      ║
 * ║    - full_desc: string                                       ║
 * ║    - price: decimal                                          ║
 * ║    - thumbnail: string                                       ║
 * ║    - is_disabled: bool    (default: false)                   ║
 * ║    - lectures: List<Lecture>  (@OneToMany)                   ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Course ◆──── 0..* Lecture (composition)                   ║
 * ║    Course ────→ Category   (@ManyToOne)                      ║
 * ║    Course ────→ User/Instructor (@ManyToOne)                 ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [03] View Course Details, [04] Search Course,             ║
 * ║    [07] View by Category, [08] Filter, [13] Create,         ║
 * ║    [15] Manage, [16] Toggle Status, [18] Edit,              ║
 * ║    [19] Manage Courses (Admin)                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */


/**
 * Entity class Course — tương đương @Entity trong Spring Boot.
 * Bảng DB: "courses"
 */
class Course {

  // ─── @Column definitions ───

  /** @Column(name = "id", primaryKey = true, autoIncrement = true) */
  id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "instructor_id", referencedColumnName = "id")
   * Quan hệ: Course → User (Instructor)
   */
  instructor_id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "category_id", referencedColumnName = "id")
   * Quan hệ: Course → Category
   */
  category_id;

  /** @Column(name = "title", nullable = false) */
  title;

  /** @Column(name = "short_desc", nullable = true) */
  short_desc;

  /** @Column(name = "full_desc", nullable = true, columnDefinition = "TEXT") */
  full_desc;

  /** @Column(name = "price", nullable = true, precision = 10, scale = 2) */
  price;

  /** @Column(name = "thumbnail", nullable = true) */
  thumbnail;

  /** @Column(name = "is_disabled", nullable = false, default = false) */
  is_disabled;

  /**
   * @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = LAZY)
   * Quan hệ composition: Course ◆──── 0..* Lecture
   * Xóa Course → xóa tất cả Lecture con.
   */
  lectures;

  // ─── Constructor ───

  constructor(data = {}) {
    this.id = data.id || null;
    this.instructor_id = data.instructor_id || null;
    this.category_id = data.category_id || null;
    this.title = data.title || null;
    this.short_desc = data.short_desc || null;
    this.full_desc = data.full_desc || null;
    this.price = data.price || 0;
    this.thumbnail = data.thumbnail || null;
    this.is_disabled = data.is_disabled || false;
    this.lectures = data.lectures || [];
  }

  validate() {
    if (!this.title || this.title.trim() === '') {
      throw new Error('Title must not be blank');
    }
    return true;
  }
}

export default Course;