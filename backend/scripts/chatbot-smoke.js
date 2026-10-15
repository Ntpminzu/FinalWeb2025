import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { repositoryRoot } from '../src/config/paths.js';

// Uses real Ollama with disposable PostgreSQL; never opens the configured production database.
const probe = net.createServer();
await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(4100, '127.0.0.1', resolve); });
await new Promise(resolve => probe.close(resolve));
const child = spawn(process.execPath, ['backend/scripts/demo-server.js'], {
  cwd: repositoryRoot, windowsHide: true, stdio: 'inherit',
  env: { ...process.env, SERVE_CLIENT: 'false', OLLAMA_URL: process.env.OLLAMA_URL || 'http://127.0.0.1:11434' },
});
const base = 'http://127.0.0.1:4100/api/v1';
const report = [];
const deadline = Date.now() + 60000;
try {
  while (!(await fetch(`${base}/health`).then(response => response.ok).catch(() => false))) {
    if (child.exitCode !== null || Date.now() > deadline) throw new Error('Demo startup failed. Ensure port 4100 is available.');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const tokens = {};
  for (const role of ['student', 'teacher', 'admin']) {
    const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: role, password: 'Demo12345!' }) });
    tokens[role] = (await response.json()).data.accessToken;
  }
  for (const [role, question] of [
    ['guest', 'Tôi muốn học React, có khóa học nào phù hợp và giá bao nhiêu?'],
    ['guest', 'So sánh khóa ReactJS và Node.js: nội dung và giá hiện tại.'],
    ['student', 'Làm sao vào học khóa đã mua và tiếp tục bài giảng?'],
    ['teacher', 'Làm sao tạo khóa học mới và thêm bài giảng?'],
    ['admin', 'Làm sao ẩn khóa học và quản lý danh mục?'],
    ['guest', 'Website hoàn tiền trong bao nhiêu ngày?'],
  ]) {
    console.log(`Smoke ${role}: ${question}`);
    const start = Date.now();
    const response = await fetch(`${base}/chatbot/messages`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(tokens[role] ? { Authorization: `Bearer ${tokens[role]}` } : {}) },
      body: JSON.stringify({ question }), signal: AbortSignal.timeout(240000) });
    const result = await response.json();
    report.push({ role, question, status: response.status, elapsedMs: Date.now() - start, ...result });
    console.log(JSON.stringify(report.at(-1)));
  }
  if (report.some(item => item.status !== 200 || !item.data?.answer)) process.exitCode = 1;
} finally {
  const output = process.env.CHATBOT_SMOKE_REPORT || path.join(tmpdir(), 'finalweb-chatbot-smoke.json');
  await writeFile(output, JSON.stringify(report, null, 2));
  console.log(`Smoke report: ${output}`);
  if (child.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
}
