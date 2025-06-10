import express from "express";
import { Request, Response } from "express";
import { getAIResponse } from "../services/ai-service";
import { chatStore, saveMessage } from "../chatStore";
import { formatMessage } from "../utils/formatMessage";
import { bot } from "../bot";

// Create the router
const router = express.Router();

// Your existing route handlers
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

router.get("/chats/:chatId", (req, res) => {
  const chat = chatStore.get(Number(req.params.chatId));

  if (!chat) {
    res.status(404).json({ error: "Чат не найден" });
  } else {
    const formattedMessages = chat.messages.map((msg, index) =>
      formatMessage(msg, index)
    );
    res.json(formattedMessages);
  }
});
//@ts-ignore
// req error
router.post("/chats/:chatId/reply", async (req: Request, res: Response) => {
  const chatId = Number(req.params.chatId);
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    // Сохраняем сообщение как "от бота", но по сути — это оператор
    saveMessage(chatId, "Operator", {
      role: "assistant",
      content: text,
      timestamp: new Date(),
    });

    // Отправляем его в Telegram
    await bot.api.sendMessage(chatId, text);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//@ts-ignore
// req error
router.post("/chats/:chatId/send", async (req, res) => {
  const chatId = Number(req.params.chatId);
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    // Сохраняем сообщение пользователя
    saveMessage(chatId, "User", {
      role: "user",
      content: text,
      timestamp: new Date(),
    });

    // Собираем предыдущую историю чата из store (если нужно)
    const chat = chatStore.get(chatId);
    const chatHistory = chat?.messages || [];

    // Подделываем Telegram-контекст
    const fakeCtx = {
      from: { first_name: "User" },
      session: {
        chatHistory,
      },
    };

    // Получаем ответ от AI
    const response = await getAIResponse(fakeCtx as any, text, `Клиент User`);

    // Сохраняем ответ бота
    saveMessage(chatId, "Bot", {
      role: "assistant",
      content: response,
      timestamp: new Date(),
    });

    // Отправляем сообщение в Telegram
    await bot.api.sendMessage(chatId, response);

    res.json({ success: true, reply: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
