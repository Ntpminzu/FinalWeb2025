import express from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { optionalApiUser } from '../../auth/middlewares/api-auth.middleware.js';
import { sendMessage, health } from '../controllers/chatbot.api.controller.js';

const router = express.Router();
const chatLimiter = rateLimit({
  windowMs: 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  keyGenerator: req => req.user ? `user:${req.user.id}` : `guest:${ipKeyGenerator(req.ip)}`,
  handler: (req, res) => res.status(429).json({ error: { code: 'CHATBOT_RATE_LIMITED',
    message: 'Bạn đã gửi nhiều câu hỏi. Hãy chờ một phút rồi thử lại.', status: 429 } }),
});
router.get('/chatbot/health', health);
router.post('/chatbot/messages', optionalApiUser, chatLimiter, sendMessage);
export default router;
