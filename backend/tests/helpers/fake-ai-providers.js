import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

function vector(text) {
  const result = Array(1024).fill(0.01);
  for (const word of text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').match(/[\p{L}\p{N}]+/gu) || [])
    result[createHash('sha256').update(word).digest()[0] % result.length]++;
  return result;
}

export function createFakeAiProviders() {
  const state = { embedInputs: [], chatPayloads: [], offline: false, failEmbedding: false };
  const server = createServer(async (incoming, response) => {
    let body = '';
    for await (const chunk of incoming) body += chunk;
    const payload = body ? JSON.parse(body) : {};
    const embedding = incoming.url?.includes('/ai/run/');
    response.setHeader('Content-Type', 'application/json');
    if (state.offline || (embedding && state.failEmbedding)) {
      response.writeHead(503); response.end(JSON.stringify({ success: false, errors: ['test unavailable'] })); return;
    }
    if (incoming.headers.authorization !== 'Bearer test-key') {
      response.writeHead(403); response.end(JSON.stringify({ error: 'missing key', success: false })); return;
    }
    if (embedding) {
      const inputs = payload.text;
      state.embedInputs.push(...inputs);
      response.end(JSON.stringify({ success: true, errors: [], result: { shape: [inputs.length, 1024], data: inputs.map(vector) } }));
    } else if (incoming.url?.endsWith('/chat/completions')) {
      state.chatPayloads.push(payload);
      response.end(JSON.stringify({ choices: [{ message: { content: 'Bạn có thể mở nguồn tham khảo để xem thông tin [S1].' }, finish_reason: 'stop' }] }));
    } else { response.writeHead(404); response.end('{}'); }
  });
  return { server, state };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { server } = createFakeAiProviders();
  server.listen(11435, '127.0.0.1', () => console.log('Test AI providers: 11435'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); server.closeAllConnections(); });
}
