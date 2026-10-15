import db from '../src/config/database.js';
import { chatbotService } from '../src/modules/chatbot/services/chatbot.service.js';

try { console.log(JSON.stringify(await chatbotService.synchronize(), null, 2)); }
catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await db.destroy(); }
