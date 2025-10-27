export function restrict(req, res, next) {
  // Kiểm tra nếu đã đăng nhập
  if (req.session.isAuthenticated && req.session.authUser) {
    return next();
  }

  // Nếu chưa đăng nhập → lưu URL để quay lại sau khi đăng nhập
  req.session.retUrl = req.originalUrl;
  return res.redirect('/account/signin');
}

// 🔹 Chỉ dành cho sinh viên (permission = 1)
export function restrictStudent(req, res, next) {
  const user = req.session.authUser;

  // Chưa đăng nhập → chuyển sang đăng nhập
  if (!req.session.isAuthenticated || !user) {
    req.session.retUrl = req.originalUrl;
    return res.redirect('/account/signin');
  }

  // Không phải sinh viên → chặn lại
  if (user.permission !== 1) {
    return res.status(403).render('403', {
      message: 'Bạn không có quyền truy cập trang này. (Chỉ dành cho học viên)'
    });
  }

  next();
}
export function restrictAdmin(req, res, next) {
  const user = req.session.authUser;

  if (!req.session.isAuthenticated || !user) {
    req.session.retUrl = req.originalUrl;
    return res.redirect('/account/signin');
  }

  if (user.permission !== 3) {
    return res.status(403).render('403', {
      message: 'Bạn không có quyền truy cập trang này. (Chỉ dành cho quản trị viên)'
    });
  }

  next();
}

export function restrictInstructor(req, res, next) {
  const user = req.session.authUser;  // user: {id, permission, name, email, avatar, role}  
  if (!req.session.isAuthenticated || !user) {
    req.session.retUrl = req.originalUrl;
    return res.redirect('/account/signin');
  }
  if (user.permission !== 2) {
    return res.status(403).render('403', {
      message: 'Bạn không có quyền truy cập trang này. (Chỉ dành cho giảng viên)'
    });
  } 
  next();
}
