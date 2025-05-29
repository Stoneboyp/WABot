import express from 'express';
import { bot } from '../bot';
import { chatStore } from '../chatStore';
import { saveMessage } from '../chatStore';

const router = express.Router();

// Получение списка чатов
router.get('/chats', (req, res) => {
  const chats = Array.from(chatStore.values()).map(chat => ({
    chatId: chat.chatId,
    userName: chat.userName,
    updatedAt: chat.updatedAt
  }));
  res.json(chats);
});

// Получение истории сообщений
router.get('/chats/:chatId', (req, res) => {
  const chat = chatStore.get(Number(req.params.chatId));
  res.json(chat?.messages || []);
});

// Отправка сообщения от оператора
router.post('/chats/:chatId/send', async (req, res) => {
  const { text } = req.body;
  const chatId = Number(req.params.chatId);

  await bot.api.sendMessage(chatId, text);

  // Сохраняем сообщение в историю
  saveMessage(chatId, 'Operator', {
    role: 'assistant',
    content: text,
    timestamp: new Date()
  });

  res.json({ status: 'sent' });
});

export default router;
