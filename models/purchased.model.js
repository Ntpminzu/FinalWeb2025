class Purchased {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || null;
    this.course_id = data.course_id || null;
    this.course_title = data.course_title || null;
    this.purchased_at = data.purchased_at || null;
  }

  validate() {
    if (!this.user_id) throw new Error('User ID must not be empty');
    if (!this.course_id) throw new Error('Course ID must not be empty');
    return true;
  }
}

export default Purchased;
