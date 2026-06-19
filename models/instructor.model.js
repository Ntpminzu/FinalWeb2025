/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «entity» Instructor — Class Diagram (permission=2)         ║
 * ║  Kế thừa: User                                              ║
 * ║                                                              ║
 * ║  Tương đương @Entity @Table("instructors") trong Spring Boot ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - user_id: int         (FK → users.id, unique)            ║
 * ║    - bio: string                                             ║
 * ║    - specialization: string                                  ║
 * ║                                                              ║
 * ║  Quan hệ:                                                   ║
 * ║    Instructor ────→ User  (@OneToOne)                        ║
 * ║    Instructor ←──── Course (@OneToMany)                      ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [13] Create Course, [14] Manage Lecture,                  ║
 * ║    [15] Manage Course, [16] Toggle Status,                   ║
 * ║    [18] Edit Course, [21] Manage Profile                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */



/**
 * Entity class Instructor — tương đương @Entity trong Spring Boot.
 * Bảng DB: "instructors" (bảng mở rộng của users)
 */
class Instructor {

  // ─── @Column definitions ───

  /**
   * @OneToOne(fetch = LAZY, optional = false)
   * @JoinColumn(name = "user_id", nullable = false, unique = true)
   * Quan hệ: Instructor → User
   */
  user_id;

  /** @Column(name = "bio", nullable = true, columnDefinition = "TEXT") */
  bio;

  /** @Column(name = "specialization", nullable = true) */
  specialization;

  // ─── Constructor ───

  constructor(data = {}) {
    this.user_id = data.user_id || null;
    this.bio = data.bio || null;
    this.specialization = data.specialization || null;
    // Joined fields from User
    this.name = data.name || null;
    this.email = data.email || null;
    this.username = data.username || null;
    this.total_students = data.total_students || 0;
    this.total_courses = data.total_courses || 0;
    this.rating_avg = data.rating_avg || 0;
  }

}

export default Instructor;