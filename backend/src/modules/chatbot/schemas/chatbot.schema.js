import { ValidationError } from '../../../common/errors/app-error.js';
import { chatbotConfig } from '../../../config/chatbot.js';

export function selectHistory(history = [], settings = chatbotConfig) {
  if (!Array.isArray(history) || history.length > 20 || history.length % 2 !== 0)
    throw new ValidationError('Lịch sử phải gồm tối đa 10 cặp user/assistant hoàn chỉnh.');
  let inputChars = 0;
  history.forEach((message, i) => {
    if (!message || message.role !== (i % 2 ? 'assistant' : 'user') ||
        typeof message.content !== 'string' || !message.content.trim() || message.content.length > 6000)
      throw new ValidationError('Lịch sử phải xen kẽ user/assistant, mỗi nội dung từ 1–6000 ký tự.');
    inputChars += message.content.length;
  });
  if (inputChars > 20000) throw new ValidationError('Lịch sử không được vượt 20000 ký tự.');
  const selected = [];
  let usedChars = 0;
  for (let i = history.length - 2; i >= 0 && selected.length < settings.historyMaxMessages; i -= 2) {
    const pair = history.slice(i, i + 2).map(({ role, content }) => ({
      role,
      content: (role === 'assistant' ? content.replace(/\[S\d+\]/g, '') : content)
        .trim().slice(0, settings.historyMessageMaxChars) || '(Câu trả lời trước chỉ có mã nguồn.)',
    }));
    const count = pair.reduce((sum, message) => sum + message.content.length, 0);
    if (usedChars + count > settings.historyMaxChars) break;
    selected.unshift(...pair);
    usedChars += count;
  }
  return selected;
}

export function chatInput(input) {
  if (!input || Object.keys(input).some(key => !['question', 'history'].includes(key)))
    throw new ValidationError('Chỉ nhận question và history; vai trò được xác định từ tài khoản.');
  if (typeof input.question !== 'string' || !input.question.trim() || input.question.length > 2000)
    throw new ValidationError('Câu hỏi phải là văn bản từ 1–2000 ký tự.');
  return { question: input.question.trim(), history: selectHistory(input.history) };
}
