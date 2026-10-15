import { test, expect } from '@playwright/test';

async function openChat(page) {
  await page.getByRole('button', { name: 'Mở trợ lý', exact: true }).click();
  return page.getByRole('dialog', { name: 'Trợ lý Online Academy' });
}
async function ask(dialog, question) {
  await dialog.getByLabel('Câu hỏi cho trợ lý').fill(question);
  await dialog.getByRole('button', { name: 'Gửi', exact: true }).click();
}
async function login(page, username) {
  await page.goto('/account/signin');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Demo12345!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('button', { name: /Demo$/ })).toBeVisible();
}

test('guest uses the real chatbot API, opens sources, keeps chat through navigation and resets on reload', async ({ page }) => {
  await page.goto('/');
  const dialog = await openChat(page);
  await ask(dialog, 'Khóa học ReactJS giá bao nhiêu?');
  await expect(dialog.locator('.chatbot-assistant')).toHaveCount(1);
  await dialog.getByText(/Nguồn tham khảo/).click();
  await expect(dialog.getByRole('link').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/chatbot-desktop.png', fullPage: true });
  await dialog.getByRole('link').first().click();
  await expect(dialog.locator('.chatbot-assistant')).toHaveCount(1);
  await dialog.getByLabel('Câu hỏi cho trợ lý').press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Mở trợ lý', exact: true })).toBeFocused();
  await openChat(page);
  await expect(dialog.locator('.chatbot-assistant')).toHaveCount(1);
  await page.reload();
  await openChat(page);
  await expect(dialog.locator('.chatbot-message')).toHaveCount(0);
});

test('mobile chat sends only completed pairs, safely renders model text and starts a fresh conversation', async ({ page }) => {
  const bodies = [];
  await page.route('**/api/v1/chatbot/messages', async route => {
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ json: { data: { answer: 'Nội dung <img src=x onerror=alert(1)> [S1]',
      sources: [{ id: 'guide:public:1', citation: 'S1', title: 'Tìm khóa học', url: '/courses', excerpt: 'Mở danh sách khóa học.' }], warnings: [] } } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dialog = await openChat(page);
  await dialog.getByLabel('Câu hỏi cho trợ lý').fill('Tìm React');
  await dialog.getByLabel('Câu hỏi cho trợ lý').press('Enter');
  await expect(dialog.locator('.chatbot-assistant')).toHaveCount(1);
  expect(await dialog.locator('img').count()).toBe(0);
  await ask(dialog, 'Còn Node thì sao?');
  await expect(dialog.locator('.chatbot-assistant')).toHaveCount(2);
  expect(bodies[1].history.map(message => message.role)).toEqual(['user', 'assistant']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: 'test-results/chatbot-mobile.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Cuộc trò chuyện mới' }).click();
  await expect(dialog.locator('.chatbot-message')).toHaveCount(0);
  await ask(dialog, 'Câu hỏi mới');
  await expect(dialog.locator('.chatbot-assistant')).toHaveCount(1);
  expect(bodies.at(-1).history).toEqual([]);
});

test('chat failure is recoverable and never becomes conversation history', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/v1/chatbot/messages', async route => {
    attempts++;
    if (attempts === 1) return route.fulfill({ status: 503, json: { error: { code: 'CHATBOT_MODEL_UNAVAILABLE', message: 'Dịch vụ chatbot chưa sẵn sàng.', status: 503 } } });
    expect(route.request().postDataJSON().history).toEqual([]);
    return route.fulfill({ json: { data: { answer: 'Đã kết nối lại.', sources: [], warnings: [] } } });
  });
  await page.goto('/');
  const dialog = await openChat(page);
  await ask(dialog, 'Lần đầu');
  await expect(dialog.getByRole('alert')).toContainText('Dịch vụ chatbot chưa sẵn sàng.');
  await ask(dialog, 'Thử lại');
  await expect(dialog.locator('.chatbot-assistant')).toContainText('Đã kết nối lại.');
});

test('account change cancels pending chat and drops old results across tabs', async ({ page, context }) => {
  await login(page, 'student');
  const dialog = await openChat(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let requested;
  const started = new Promise(resolve => { requested = resolve; });
  await page.route('**/api/v1/chatbot/messages', async route => {
    requested(); await gate;
    await route.fulfill({ json: { data: { answer: 'OLD-ACCOUNT-ANSWER', sources: [], warnings: [] } } }).catch(() => {});
  });
  await ask(dialog, 'OLD-ACCOUNT-QUESTION'); await started;
  const second = await context.newPage();
  await second.goto('/');
  await second.getByRole('button', { name: 'Học viên Demo' }).click();
  await second.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(second).toHaveURL(/account\/signin/);
  await login(second, 'teacher');
  await expect(page.getByRole('button', { name: 'Giảng viên Demo' })).toBeVisible();
  await openChat(page);
  await expect(dialog.getByRole('button', { name: 'Làm sao tạo khóa học mới?' })).toBeVisible();
  release();
  await expect(dialog.locator('.chatbot-message')).toHaveCount(0);
  await second.close();
  await dialog.getByRole('button', { name: 'Đóng trợ lý' }).click();
  await page.getByRole('button', { name: 'Giảng viên Demo' }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await openChat(page);
  await expect(dialog.getByRole('button', { name: 'Làm sao đăng ký tài khoản học viên?' })).toBeVisible();
});
