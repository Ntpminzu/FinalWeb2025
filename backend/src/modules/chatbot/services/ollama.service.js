import { AppError } from '../../../common/errors/app-error.js';
import { chatbotConfig } from '../../../config/chatbot.js';

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length)
    throw new AppError('Vector không hợp lệ hoặc khác số chiều.', 503, 'CHATBOT_INDEX_INVALID');
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    if (!Number.isFinite(a[i]) || !Number.isFinite(b[i]))
      throw new AppError('Vector chứa giá trị không hợp lệ.', 503, 'CHATBOT_INDEX_INVALID');
    dot += a[i] * b[i]; normA += a[i] ** 2; normB += b[i] ** 2;
  }
  if (!normA || !normB) throw new AppError('Vector rỗng.', 503, 'CHATBOT_INDEX_INVALID');
  return Math.max(-1, Math.min(1, dot / Math.sqrt(normA * normB)));
}

export function createOllamaClient(settings = chatbotConfig, fetchImpl = globalThis.fetch) {
  async function request(endpoint, body, timeoutMs = settings.timeoutMs) {
    try {
      const response = await fetchImpl(`${settings.ollamaUrl}${endpoint}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      let result;
      try { result = await response.json(); }
      catch (error) {
        if (['AbortError', 'TimeoutError'].includes(error.name)) throw error;
        throw new AppError('Ollama trả dữ liệu không hợp lệ.', 502, 'CHATBOT_MODEL_RESPONSE');
      }
      if (!response.ok || result.error) throw new AppError('Ollama chưa xử lý được yêu cầu. Kiểm tra model và tài nguyên máy.', 503, 'CHATBOT_MODEL_UNAVAILABLE');
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (['AbortError', 'TimeoutError'].includes(error.name))
        throw new AppError('Chatbot xử lý quá lâu. Hãy thử lại với câu hỏi ngắn hơn.', 504, 'CHATBOT_TIMEOUT');
      throw new AppError('Chưa kết nối được Ollama. Hãy mở Ollama rồi thử lại.', 503, 'CHATBOT_MODEL_UNAVAILABLE');
    }
  }
  return {
    async modelsReady() {
      const result = await request('/api/tags', undefined, settings.healthTimeoutMs);
      const names = (result.models || []).map(model => model.name);
      return [settings.chatModel, settings.embeddingModel].every(name => names.includes(name));
    },
    async embed(texts) {
      const result = await request('/api/embed', { model: settings.embeddingModel, input: texts,
        truncate: false, keep_alive: settings.modelKeepAlive, options: { num_ctx: settings.embeddingContext } });
      if (!Array.isArray(result.embeddings) || result.embeddings.length !== texts.length)
        throw new AppError('Ollama trả thiếu embedding.', 502, 'CHATBOT_MODEL_RESPONSE');
      for (const vector of result.embeddings) cosineSimilarity(result.embeddings[0], vector);
      return result.embeddings;
    },
    async generate(messages) {
      const result = await request('/api/chat', { model: settings.chatModel, messages,
        stream: false, think: true, keep_alive: settings.modelKeepAlive, options: settings.generation });
      if (typeof result.message?.content !== 'string' || !result.message.content.trim())
        throw new AppError('Model chưa tạo được câu trả lời hoàn chỉnh. Hãy thử lại với câu hỏi ngắn hơn.', 502, 'CHATBOT_MODEL_RESPONSE');
      return { answer: result.message.content.trim(), truncated: result.done_reason === 'length' };
    },
  };
}
