import { ok } from '../../../common/utils/api-response.js';
import { chatInput } from '../schemas/chatbot.schema.js';
import { chatbotService } from '../services/chatbot.service.js';

export async function sendMessage(req, res) {
  const { question, history } = chatInput(req.body);
  return ok(res, await chatbotService.answer(question, history, req.user?.role || 'guest'));
}

export async function health(req, res) {
  return ok(res, await chatbotService.health());
}
