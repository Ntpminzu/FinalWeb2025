class Cart {
  user_id;
  cart_id;
  items;

  constructor(data = {}) {
    if (Array.isArray(data)) {
      this.items = data;
      this.user_id = null;
      this.cart_id = null;
    } else {
      this.user_id = data.user_id || null;
      this.cart_id = data.cart_id || null;
      this.items = data.items || [];
    }
  }


  addItem(course) {
    if (!course) return;
    const exists = this.items.some(item => String(item.id) === String(course.id));
    if (!exists) {
      this.items.push(course);
    }
  }

  removeItem(courseId) {
    this.items = this.items.filter(item => String(item.id) !== String(courseId));
  }

  getTotalPrice() {
    let total = 0;
    for (const course of this.items) {
      const priceToSum = course.sale_price || course.price || 0;
      total += parseFloat(priceToSum);
    }
    return total;
  }

  clear() {
    this.items = [];
  }
}

export default Cart;
