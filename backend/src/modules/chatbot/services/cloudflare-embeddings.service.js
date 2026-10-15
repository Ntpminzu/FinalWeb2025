import { AppError } from '../../../common/errors/app-error.js';
import { chatbotConfig } from '../../../config/chatbot.js';

export function createCloudflareEmbeddingsClient(settings = chatbotConfig, fetchImpl = globalThis.fetch) {
  async function request(texts) {
    if (!settings.cloudflareAccountId || !settings.cloudflareApiToken)
      throw new AppError('Chưa cấu hình CLOUDFLARE_ACCOUNT_ID và CLOUDFLARE_API_TOKEN trên backend.', 503, 'CHATBOT_MODEL_UNAVAILABLE');
    try {
      const endpoint = `${settings.cloudflareApiUrl}/accounts/${settings.cloudflareAccountId}/ai/run/${settings.embeddingModel}`;
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.cloudflareApiToken}` },
        body: JSON.stringify({ text: texts }),
        signal: AbortSignal.timeout(settings.timeoutMs),
      });
      let result;
      try { result = await response.json(); }
      catch (error) {
        if (['AbortError', 'TimeoutError'].includes(error.name)) throw error;
        throw new AppError('Cloudflare trả dữ liệu embedding không hợp lệ.', 502, 'CHATBOT_MODEL_RESPONSE');
      }
      if (!response.ok || !result?.success || result.errors?.length)
        throw new AppError('Cloudflare chưa tạo được embedding. Kiểm tra token, Account ID và model.', 503, 'CHATBOT_MODEL_UNAVAILABLE');
      return result.result?.data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (['AbortError', 'TimeoutError'].includes(error.name))
        throw new AppError('Tạo embedding quá lâu. Hãy thử lại sau.', 504, 'CHATBOT_TIMEOUT');
      throw new AppError('Chưa kết nối được Cloudflare Workers AI.', 503, 'CHATBOT_MODEL_UNAVAILABLE');
    }
  }

  return {
    configured: () => Boolean(settings.cloudflareAccountId && settings.cloudflareApiToken && settings.embeddingModel),
    async embed(texts) {
      const vectors = await request(texts);
      if (!Array.isArray(vectors) || vectors.length !== texts.length ||
          vectors.some(vector => !Array.isArray(vector) || vector.length !== settings.embeddingDimensions ||
            vector.some(value => !Number.isFinite(value)) || !vector.some(value => value !== 0)))
        throw new AppError('Cloudflare trả embedding không hợp lệ.', 502, 'CHATBOT_MODEL_RESPONSE');
      return vectors;
    },
  };
}
