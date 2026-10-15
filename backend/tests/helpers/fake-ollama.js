import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

function vector(text) {
  const result = Array(1024).fill(0.01);
  for (const word of text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').match(/[\p{L}\p{N}]+/gu) || [])
    result[createHash('sha256').update(word).digest()[0] % result.length]++;
  return result;
}

export function createFakeOllama() {
  const state = { embedInputs: [], chatPayloads: [], offline: false, failEmbedding: false };
  const server = createServer(async (incoming, response) => {
    let body = '';
    for await (const chunk of incoming) body += chunk;
    const payload = body ? JSON.parse(body) : {};
    response.setHeader('Content-Type', 'application/json');
    if (state.offline || (incoming.url === '/api/embed' && state.failEmbedding)) {
      response.writeHead(503); response.end(JSON.stringify({ error: 'test unavailable' })); return;
    }
    if (incoming.url === '/api/tags') {
      response.end(JSON.stringify({ models: [{ name: 'qwen3:4b' }, { name: 'qwen3-embedding:0.6b' }] }));
    } else if (incoming.url === '/api/embed') {
      state.embedInputs.push(...payload.input);
      response.end(JSON.stringify({ embeddings: payload.input.map(vector) }));
    } else if (incoming.url === '/api/chat') {
      state.chatPayloads.push(payload);
      response.end(JSON.stringify({ message: { content: 'Bạn có thể mở nguồn tham khảo để xem thông tin [S1].' }, done_reason: 'stop' }));
    } else { response.writeHead(404); response.end('{}'); }
  });
  return { server, state };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { server } = createFakeOllama();
  server.listen(11435, '127.0.0.1', () => console.log('Test Ollama: 11435'));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); server.closeAllConnections(); });
}
