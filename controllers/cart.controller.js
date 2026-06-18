/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  «session – no DB» Cart — Class Diagram                     ║
 * ║                                                              ║
 * ║  Attributes:                                                 ║
 * ║    - user_id: int                                            ║
 * ║    - items: List<Course>                                     ║
 * ║    - cart_id: int                                            ║
 * ║                                                              ║
 * ║  Methods:                                                    ║
 * ║    + addItem(course): void           → addToCart()           ║
 * ║    + removeItem(courseId): void       → removeFromCart()     ║
 * ║    + getTotalPrice(): decimal        → getTotalPrice()      ║
 * ║    + clear(): void                   → clearCart()           ║
 * ║    + checkout(): Order               → checkout()           ║
 * ║                                                              ║
 * ║  Lưu ý:                                                     ║
 * ║    Cart lưu trong session (không có bảng DB).                ║
 * ║    req.session.cart = Array<Course>                           ║
 * ║                                                              ║
 * ║  UC liên quan:                                               ║
 * ║    [05] Manage Cart, [06] Checkout                           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import Course from '../models/course.model.js';
import db from '../utils/db.js';

// ─── Class Diagram: Cart.addItem(course) ── UC [05] Manage Cart (a. Thêm) ───
/**
 * Thêm khóa học vào giỏ hàng (session).
 * UC [05] Main Flow a: Actor nhấn "thêm vào giỏ hàng".
 * Exception a.2.1: Không thể thêm cùng 1 khóa học nhiều lần.
 */
export async function addToCart(req, res, next) {
  try {
    const courseId = req.body.course_id;
    const course = await Course.findById(courseId);

    if (course) {
      let isCourseInCart = false;
      for (const item of req.session.cart) {
        if (String(item.id) === String(course.id)) {
          isCourseInCart = true;
          break;
        }
      }
      if (!isCourseInCart) {
        req.session.cart.push(course);
      }
    }
    res.redirect(req.headers.referer || '/');
  } catch (err) {
    next(err);
  }
}

// ─── Class Diagram: Cart.removeItem(courseId) ── UC [05] Manage Cart (c. Xóa) ───
/**
 * Xóa khóa học khỏi giỏ hàng.
 * UC [05] Main Flow c: Actor nhấn icon "thùng rác".
 */
export function removeFromCart(req, res) {
  const courseIdToRemove = req.body.course_id;
  req.session.cart = (req.session.cart || []).filter(item => String(item.id) !== String(courseIdToRemove));
  res.redirect('/cart');
}

// ─── Class Diagram: Cart.getTotalPrice() ───
/**
 * Tính tổng tiền giỏ hàng.
 * UC [05] Main Flow b.3: Hiển thị tổng tiền cần thanh toán.
 */
export function getTotalPrice(cart) {
  let total = 0;
  for (const course of cart) {
    const priceToSum = course.sale_price || course.price || 0;
    total += parseFloat(priceToSum);
  }
  return total;
}

// ─── Class Diagram: Cart (hiển thị giỏ hàng) ── UC [05] Manage Cart (b. Xem) ───
/**
 * Hiển thị trang giỏ hàng.
 * UC [05] Main Flow b: Hệ thống hiển thị các khóa học + bảng tóm tắt.
 */
export function showCart(req, res) {
  const cartCourses = req.session.cart || [];
  const total = getTotalPrice(cartCourses);
  res.render('vwCart/list', {
    layout: 'main',
    courses: cartCourses,
    empty: cartCourses.length === 0,
    total
  });
}

// ─── Class Diagram: Cart.clear() ───
/**
 * Xóa toàn bộ giỏ hàng.
 * Được gọi sau khi checkout thành công.
 */
export function clearCart(req) {
  req.session.cart = [];
}

// ─── Class Diagram: Cart.checkout() ── UC [06] Checkout ───
/**
 * Thanh toán giỏ hàng.
 * UC [06] Main Flow:
 *   1. Actor nhấn "Thanh toán"
 *   2. Hệ thống xử lý giao dịch
 *   3. Thêm khóa học vào danh sách đã mua (purchased)
 *   4. Xóa giỏ hàng
 *   5. Chuyển đến trang khóa học đã mua
 * Exception 1.1: Nếu Guest → redirect đến Login.
 */
export async function checkout(req, res, next) {
  try {
    // Exception 1.1: Guest chưa đăng nhập
    if (!req.session.isAuthenticated) {
      return res.redirect('/account/signin');
    }

    const cart = req.session.cart || [];
    const userId = req.session.authUser.id;

    if (cart.length === 0) {
      return res.redirect('/cart');
    }

    // 1) Khóa học user đã mua
    const ownedRows = await db('purchased')
      .where('user_id', userId)
      .select('course_id');
    const ownedCourseIds = ownedRows.map(r => String(r.course_id));

    // 2) Lọc chỉ giữ khóa học chưa mua
    const toBuy = cart.filter(item => !ownedCourseIds.includes(String(item.id)));

    // 3) Ghi purchased
    if (toBuy.length > 0) {
      const now = new Date();
      const rows = toBuy.map(c => ({
        user_id: userId,
        course_id: c.id,
        course_title: c.title,
        purchased_at: now
      }));
      await db('purchased').insert(rows);
    }

    // 4) Xóa giỏ hàng (Class Diagram: Cart.clear())
    clearCart(req);

    // 5) Chuyển đến trang khóa học đã mua
    res.redirect('/student/courses');

  } catch (err) {
    console.error('Lỗi khi thanh toán:', err);
    next(err);
  }
}
