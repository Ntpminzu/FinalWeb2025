import './load-env.js';
import path from 'node:path';
import { backendRoot } from './paths.js';

function positiveInteger(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
  return value;
}

export const chatbotConfig = Object.freeze({
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqApiUrl: (process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  cloudflareApiUrl: (process.env.CLOUDFLARE_API_URL || 'https://api.cloudflare.com/client/v4').replace(/\/$/, ''),
  chatModel: process.env.CHAT_MODEL || 'qwen/qwen3.8-27b',
  embeddingModel: process.env.EMBEDDING_MODEL || '@cf/baai/bge-m3',
  embeddingDimensions: 1024,
  guidesDir: path.join(backendRoot, 'knowledge', 'chatbot'),
  chunkSize: 800,
  overlap: 120,
  topK: 5,
  embeddingBatchSize: 8,
  historyMaxMessages: 6,
  historyMaxChars: 4000,
  historyMessageMaxChars: 1000,
  timeoutMs: positiveInteger('CHATBOT_TIMEOUT_MS', 180000),
  generation: { temperature: 0.6, maxOutputTokens: 2048 },
});
