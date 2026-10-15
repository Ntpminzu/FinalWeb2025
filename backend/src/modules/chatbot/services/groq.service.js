import { AppError } from '../../../common/errors/app-error.js';
import { chatbotConfig } from '../../../config/chatbot.js';

export function createGroqClient(settings = chatbotConfig, fetchImpl = globalThis.fetch) {
  async function request(messages) {
    if (!settings.groqApiKey)
      throw new AppError('Chưa cấu hình GROQ_API_KEY trên backend.', 503, 'CHATBOT_MODEL_UNAVAILABLE');
    try {
      const response = await fetchImpl(`${settings.groqApiUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.groqApiKey}` },
        body: JSON.stringify({ model: settings.chatModel, messages,
          temperature: settings.generation.temperature, max_tokens: settings.generation.maxOutputTokens }),
        signal: AbortSignal.timeout(settings.timeoutMs),
      });
      let result;
      try { result = await response.json(); }
      catch (error) {
        if (['AbortError', 'TimeoutError'].includes(error.name)) throw error;
        throw new AppError('Groq trả dữ liệu không hợp lệ.', 502, 'CHATBOT_MODEL_RESPONSE');
      }
      if (!response.ok || !result || result.error)
        throw new AppError('Groq chưa xử lý được yêu cầu. Kiểm tra API key, hạn mức và model.', 503, 'CHATBOT_MODEL_UNAVAILABLE');
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (['AbortError', 'TimeoutError'].includes(error.name))
        throw new AppError('Chatbot xử lý quá lâu. Hãy thử lại với câu hỏi ngắn hơn.', 504, 'CHATBOT_TIMEOUT');
      throw new AppError('Chưa kết nối được Groq.', 503, 'CHATBOT_MODEL_UNAVAILABLE');
    }
  }

  return {
    configured: () => Boolean(settings.groqApiKey && settings.chatModel),
    async generate(messages) {
      const result = await request(messages);
      const choice = result.choices?.[0];
      const answer = choice?.message?.content?.trim();
      if (!answer)
        throw new AppError('Groq chưa tạo được câu trả lời hoàn chỉnh.', 502, 'CHATBOT_MODEL_RESPONSE');
      return { answer, truncated: choice.finish_reason === 'length' };
    },
  };
}
