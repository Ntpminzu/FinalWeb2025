import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const demo = process.argv.includes('--demo');
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children.filter((child) => child.exitCode === null)) child.kill();
  process.exitCode = code;
}
function run(args, env = {}, cwd = root) {
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code || 0);
  });
}
run(demo ? ['backend/scripts/demo-server.js'] : ['backend/src/server.js']);
run(
  [
    path.join(root, 'client/node_modules/vite/bin/vite.js'),
    '--host',
    demo ? '127.0.0.1' : 'localhost',
  ],
  demo ? { API_PROXY_TARGET: 'http://127.0.0.1:4100', CLIENT_PORT: '5174' } : {},
  path.join(root, 'client'),
);
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
