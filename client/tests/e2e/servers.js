import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const root = fileURLToPath(new URL('../../../', import.meta.url));
async function available(port) {
  const socket = net.createServer();
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(port, '127.0.0.1', resolve);
  });
  await new Promise((resolve) => socket.close(resolve));
}
export default async function setup() {
  await available(11435);
  await available(4100);
  await available(5174);
  const children = [];
  function start(args, cwd, env) {
    const child = spawn(process.execPath, args, {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, ...env },
      windowsHide: true,
    });
    children.push(child);
    return child;
  }
  async function stop() {
    await Promise.all(
      children.map(async (child) => {
        if (child.exitCode !== null || child.signalCode !== null) return;
        const exited = once(child, 'exit');
        child.kill();
        await exited;
      }),
    );
  }
  try {
    // Direct child processes let Windows terminate exactly these servers without taskkill/tree enumeration.
    start(['backend/tests/helpers/fake-ollama.js'], root, {});
    start(['backend/scripts/demo-server.js'], root, { SERVE_CLIENT: 'true', OLLAMA_URL: 'http://127.0.0.1:11435' });
    start(
      [path.join(root, 'client/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1'],
      path.join(root, 'client'),
      { API_PROXY_TARGET: 'http://127.0.0.1:4100', CLIENT_PORT: '5174' },
    );
    const deadline = Date.now() + 60000;
    for (const url of ['http://127.0.0.1:4100/api/v1/health', 'http://127.0.0.1:5174']) {
      while (true) {
        if (children.some((child) => child.exitCode !== null))
          throw new Error('Demo server exited before startup.');
        if (
          await fetch(url)
            .then((response) => response.ok)
            .catch(() => false)
        )
          break;
        if (Date.now() > deadline) throw new Error(`Demo server did not become ready: ${url}`);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    return stop;
  } catch (error) {
    await stop();
    throw error;
  }
}
