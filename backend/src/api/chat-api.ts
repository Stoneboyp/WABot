import express from "express";
import { bot } from "../bot";
import { chatStore } from "../chatStore";
import { saveMessage } from "../chatStore";
import { formatMessage } from "../utils/formatMessage";

const router = express.Router();

// Получение списка всех чатов
router.get("/chats", (req, res) => {
  const chats = Array.from(chatStore.values()).map((chat) => ({
    chatId: chat.chatId,
    userName: chat.userName,
    avatar: chat.avatar,
    updatedAt: chat.updatedAt,
    status: chat.status,
  }));

  res.json(chats);
});
// Получение списка чатов
router.get("/chats/:chatId", (req, res) => {
  const chat = chatStore.get(Number(req.params.chatId));

  if (!chat) {
    return res.status(404).json({ error: "Чат не найден" });
  }

  const formattedMessages = chat.messages.map((msg, index) =>
    formatMessage(msg, index)
  );

  res.json(formattedMessages);
});

// Отправка сообщения от оператора
router.post("/chats/:chatId/send", async (req, res) => {
  const { text } = req.body;
  const chatId = Number(req.params.chatId);

  await bot.api.sendMessage(chatId, text);

  const message = {
    role: "assistant" as const,
    content: text,
    timestamp: new Date(),
  };

  saveMessage(chatId, "Operator", message);

  // Отправляем сообщение сразу в нужном формате
  res.json({
    id: Date.now(), // временный ID, на фронте можно будет заменить
    text: message.content,
    sender: "operator",
    timestamp: message.timestamp,
  });
});

export default router;
