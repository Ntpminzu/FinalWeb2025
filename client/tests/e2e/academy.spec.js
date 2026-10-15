import { test, expect } from '@playwright/test';

async function login(page, username, returnTo = '/') {
  await page.goto(`/account/signin?returnTo=${encodeURIComponent(returnTo)}`);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Demo12345!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${returnTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect(page.getByRole('button', { name: /Demo$/ })).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('close', () => expect(errors).toEqual([]));
});

test('public catalog, category/search URLs, responsive layout and SPA deep links', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Online Academy', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Khóa học mới nhất' })).toBeVisible();
  await page.goto('/search?q=ReactJS');
  await expect(page.getByRole('link', { name: 'ReactJS từ cơ bản', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Từ khóa', { exact: true })).toHaveValue('ReactJS');
  await page.goto('/categories/1');
  await expect(page.getByRole('heading', { name: 'Lập trình', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  const production = await request.get('http://127.0.0.1:4100/student/courses/1');
  expect(production.status()).toBe(200);
  expect(await production.text()).toContain('id="root"');
  expect(production.headers()['set-cookie']).toBeUndefined();
  const api404 = await request.get('http://127.0.0.1:4100/api/v1/no-such-route');
  expect(api404.status()).toBe(404);
  expect((await api404.json()).error.code).toBe('NOT_FOUND');
  for (const url of ['/api/v2/missing', '/assets/missing.js', '/uploads/missing.png'])
    expect((await request.get(`http://127.0.0.1:4100${url}`)).status()).toBe(404);
});

test('guest cart merges, JWT survives reload and a second tab; checkout, learning and review', async ({
  page,
  context,
}) => {
  await page.goto('/courses/1');
  await page.getByRole('button', { name: 'Thêm vào giỏ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đã thêm vào giỏ' })).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('academy.guest-cart')))).toEqual(
    [1],
  );
  await login(page, 'student', '/cart');
  await expect(page.getByRole('button', { name: 'Mua khóa học', exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mua khóa học', exact: true })).toBeEnabled();
  const second = await context.newPage();
  await Promise.all([second.goto('/student/courses'), page.reload()]);
  await expect(
    second.getByRole('heading', { name: 'Khóa học của tôi', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mua khóa học', exact: true })).toBeEnabled();
  await second.close();
  await page.getByRole('button', { name: 'Mua khóa học', exact: true }).click();
  await expect(page).toHaveURL(/\/student\/courses$/);
  await expect(page.getByRole('status').filter({ hasText: 'Đã mua 1' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('academy.guest-cart')))).toEqual(
    [],
  );
  await page.getByRole('link', { name: 'Vào học', exact: true }).click();
  await page.getByRole('link', { name: /Giới thiệu ReactJS/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Giới thiệu ReactJS', exact: true }),
  ).toBeVisible();
  await page.locator('video').evaluate(async (video) => {
    if (video.readyState < 1)
      await new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', resolve, { once: true });
        video.addEventListener('error', reject, { once: true });
      });
    video.muted = true;
    await video.play();
  });
  await expect
    .poll(() => page.locator('video').evaluate((video) => video.currentTime))
    .toBeGreaterThan(0);
  await page.locator('video').evaluate((video) => {
    video.currentTime = 9.5;
    video.dispatchEvent(new Event('timeupdate'));
    video.pause();
  });
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu tại 0:09' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Đã hoàn thành', { exact: true })).toBeVisible();
  await page.goto('/student/course/1/feedback');
  await page.getByLabel('Nhận xét').fill('Học React qua API rất thuận tiện.');
  await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
  await expect(page.getByRole('button', { name: 'Cập nhật đánh giá' })).toBeVisible();
  await page.goto('/courses/1');
  await expect(page.getByText('Học React qua API rất thuận tiện.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vào học', exact: true })).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: '403', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Học viên Demo', exact: true }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  await page.goto('/student/courses');
  await expect(page).toHaveURL(/account\/signin/);
  expect(
    await page.evaluate(() =>
      [...Object.values(localStorage), ...Object.values(sessionStorage)].some((value) =>
        /accessToken|refreshToken/.test(value),
      ),
    ),
  ).toBe(false);
});

test('instructor creates, edits, uploads, manages lectures and completes course content', async ({
  page,
}) => {
  await login(page, 'teacher', '/instructor/new');
  await page.getByLabel('Tên khóa học', { exact: true }).fill('Khóa học kiểm thử React');
  await page.getByLabel('Danh mục', { exact: true }).selectOption('2');
  await page.getByLabel('Mô tả ngắn', { exact: true }).fill('Khóa học tạo từ React.');
  await page.getByLabel('Mô tả chi tiết', { exact: true }).fill('Nội dung được lưu bằng API.');
  await page.getByLabel('Giá (VND)', { exact: true }).fill('150000');
  await page.getByLabel('Giá khuyến mãi (không bắt buộc)', { exact: true }).fill('0');
  await page
    .getByLabel('Ảnh thumbnail', { exact: true })
    .setInputFiles({
      name: 'thumbnail.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZKz0AAAAASUVORK5CYII=',
        'base64',
      ),
    });
  await page.getByRole('button', { name: 'Lưu khóa học' }).click();
  await expect(page).toHaveURL(/instructor\/edit\/course\/\d+$/);
  const courseId = page.url().split('/').at(-1);
  await expect(page.getByLabel('Tên khóa học', { exact: true })).toHaveValue(
    'Khóa học kiểm thử React',
  );
  await expect(page.getByRole('img', { name: 'Ảnh xem trước' })).toBeVisible();
  const thumbnail = await page.getByRole('img', { name: 'Ảnh xem trước' }).getAttribute('src');
  expect((await page.request.get(thumbnail)).status()).toBe(200);
  await page.getByLabel('Tên khóa học', { exact: true }).fill('Khóa học React đã sửa');
  await page.getByRole('button', { name: 'Lưu khóa học' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu khóa học' })).toBeVisible();
  await page.goto(`/instructor/edit/lectures/${courseId}`);
  await page.getByLabel('Tên bài giảng', { exact: true }).fill('Bài học mới');
  await page.getByLabel('URL video', { exact: true }).fill('http://127.0.0.1:5174/media/demo.webm');
  await page.getByLabel('Thời lượng (giây)', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Lưu bài giảng' }).click();
  await expect(page.getByRole('cell', { name: 'Bài học mới', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sửa', exact: true }).click();
  await page.getByLabel('Tên bài giảng', { exact: true }).fill('Bài học đã sửa');
  await page.getByRole('button', { name: 'Lưu bài giảng' }).click();
  await expect(page.getByRole('cell', { name: 'Bài học đã sửa', exact: true })).toBeVisible();
  await page.goto('/instructor/courses');
  const row = page.getByRole('row').filter({ hasText: 'Khóa học React đã sửa' });
  await row.getByRole('button', { name: 'Hoàn thành nội dung', exact: true }).click();
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: 'Khóa học React đã sửa' })
      .getByRole('button', { name: 'Đặt chưa hoàn thành' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/instructor-desktop.png', fullPage: true });
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto(`/instructor/edit/lectures/${courseId}`);
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Bài học đã sửa', exact: true })).toHaveCount(0);
  await page.goto('/instructor/courses');
  await page
    .getByRole('row')
    .filter({ hasText: 'Khóa học React đã sửa' })
    .getByRole('button', { name: 'Xóa', exact: true })
    .click();
  await expect(page.getByRole('row').filter({ hasText: 'Khóa học React đã sửa' })).toHaveCount(0);
  await page.goto('/instructor/profile');
  await page.getByLabel('Chuyên môn', { exact: true }).fill('ReactJS và REST API');
  await page.getByRole('button', { name: 'Lưu thông tin giảng viên' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Đã lưu thông tin giảng viên' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Chuyên môn', { exact: true })).toHaveValue('ReactJS và REST API');
});

test('admin categories, role/status changes and protected data conflicts', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await login(page, 'admin', '/admin');
  await expect(page.getByRole('heading', { name: 'Tổng quan quản trị' })).toBeVisible();
  await page.goto('/admin/categories');
  await page.getByLabel('Tên danh mục', { exact: true }).fill('Danh mục kiểm thử');
  await page.getByRole('button', { name: 'Lưu danh mục' }).click();
  let row = page.getByRole('row').filter({ hasText: 'Danh mục kiểm thử' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Sửa', exact: true }).click();
  await page.getByLabel('Tên danh mục', { exact: true }).fill('Danh mục đã sửa');
  await page.getByRole('button', { name: 'Lưu danh mục' }).click();
  row = page.getByRole('row').filter({ hasText: 'Danh mục đã sửa' });
  await row.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.goto('/admin/users?q=promotable');
  await page.getByRole('button', { name: 'Chuyển giảng viên' }).click();
  await expect(page.getByRole('cell', { name: 'Giảng viên', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Khóa', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đã khóa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mở khóa', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đang hoạt động', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'promotable' })).toHaveCount(0);
  await page.goto('/admin/courses?q=ReactJS');
  await page.getByRole('button', { name: 'Khóa', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đã khóa', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mở khóa', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Đang hoạt động', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Không thể xóa khóa học đã có học viên mua');
  await expect(page.getByRole('cell', { name: 'ReactJS từ cơ bản', exact: true })).toBeVisible();
});

test('registration, username check, profile/password and watchlist work through the browser', async ({
  page,
}) => {
  await page.goto('/account/signup');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('newstudent');
  await page.getByLabel('Họ tên', { exact: true }).fill('Học viên mới React');
  await page.getByLabel('Email', { exact: true }).fill('newstudent@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Demo12345!');
  await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('Demo12345!');
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/courses/2');
  await page.getByRole('button', { name: 'Lưu yêu thích' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu vào danh sách' })).toBeVisible();
  await page.goto('/student/watchlist');
  await expect(page.getByRole('link', { name: 'Node.js và Express', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bỏ yêu thích' }).click();
  await expect(page.getByRole('link', { name: 'Node.js và Express', exact: true })).toHaveCount(0);
  await page.goto('/student/profile');
  await page.getByLabel('Họ tên', { exact: true }).fill('Tên đã cập nhật');
  await page.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã cập nhật hồ sơ' })).toBeVisible();
  await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('Demo12345!');
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill('Changed12345!');
  await page.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill('Changed12345!');
  await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  await expect(page).toHaveURL(/account\/signin/);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('newstudent');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Changed12345!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tên đã cập nhật', exact: true })).toBeVisible();
});

test('Express serves the production React build with working JWT and deep-link reloads', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4100/account/signin?returnTo=/student/profile');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('student');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Demo12345!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4100/student/profile');
  await expect(page.getByLabel('Họ tên', { exact: true })).toHaveValue('Học viên Demo');
  await page.reload();
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('student@example.test');
  await page.goto('http://127.0.0.1:4100/courses');
  await expect(page.getByRole('link', { name: 'ReactJS từ cơ bản', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/production-desktop.png', fullPage: true });
});
