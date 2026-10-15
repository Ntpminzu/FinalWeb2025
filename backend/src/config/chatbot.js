import './load-env.js';
import path from 'node:path';
import { backendRoot } from './paths.js';

function positiveInteger(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
  return value;
}

export const chatbotConfig = Object.freeze({
  ollamaUrl: (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
  chatModel: process.env.CHAT_MODEL || 'qwen3:4b',
  embeddingModel: process.env.EMBEDDING_MODEL || 'qwen3-embedding:0.6b',
  embeddingDimensions: 1024,
  guidesDir: path.join(backendRoot, 'knowledge', 'chatbot'),
  chunkSize: 800,
  overlap: 120,
  topK: 5,
  embeddingBatchSize: 8,
  embeddingContext: 2048,
  modelKeepAlive: 0, // Release VRAM between embedding and generation on the local GPU.
  historyMaxMessages: 6,
  historyMaxChars: 4000,
  historyMessageMaxChars: 1000,
  timeoutMs: positiveInteger('CHATBOT_TIMEOUT_MS', 180000),
  healthTimeoutMs: 5000,
  generation: { temperature: 0.6, top_p: 0.95, top_k: 20, num_ctx: 8192, num_predict: 4096 },
});
