/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Category — Class Diagram                          ║
 * ║                                                              ║
 * ║  Tương đương @Entity @Table("categories") trong Spring Boot  ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - id: int              (PK, auto-increment)               ║
 * ║    - parent_id: int       (FK → categories.id, self-ref)     ║
 * ║    - catname: string      (not null)                          ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Category ────→ Category (self-referencing: parent)         ║
 * ║    @ManyToOne  parent                                        ║
 * ║    @OneToMany  children                                      ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [07] View Courses by Category,                            ║
 * ║    [20] Manage Categories (Admin)                            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */



/**
 * Entity class Category — tương đương @Entity trong Spring Boot.
 * Bảng DB: "categories"
 */
class Category {

  // ─── @Column definitions ───

  /** @Column(name = "id", primaryKey = true, autoIncrement = true) */
  id;

  /**
   * @ManyToOne(fetch = LAZY)
   * @JoinColumn(name = "parent_id", nullable = true)
   * Quan hệ self-referencing: Category → Category (parent)
   */
  parent_id;

  /** @Column(name = "catname", nullable = false) */
  catname;

  /**
   * @OneToMany(mappedBy = "parent", fetch = LAZY)
   * Danh mục con (inverse side of parent_id)
   */
  children;

  // ─── Constructor ───

  constructor(data = {}) {
    this.id = data.id || null;
    this.parent_id = data.parent_id || null;
    this.catname = data.catname || null;
    this.children = data.children || [];
  }

  validate() {
    if (!this.catname || this.catname.trim() === '') {
      throw new Error('Category name must not be blank');
    }
    return true;
  }
}

export default Category;
