import express, { Request, Response } from "express";
import { getAIResponse } from "../services/ai-service";
import { saveMessage, getChat, getAllChats } from "../chatStore";
import { sendMessageToClient } from "../core/message-bus";
import { formatMessage } from "../utils/formatMessage";
import { ChatPlatform } from "../chatStore";

const router = express.Router();

/**
 * GET /chats
 * Получение всех чатов
 */
router.get("/chats", (req: Request, res: Response) => {
  const chats = getAllChats().map((chat) => ({
    chatId: chat.chatId,
    platform: chat.platform,
    userName: chat.userName,
    avatar: chat.avatar,
    updatedAt: chat.updatedAt,
    status: chat.status,
  }));

  res.json(chats);
});

/**
 * GET /chats/:chatId?platform=telegram
 * Получение истории сообщений по чату
 */
//@ts-expect-error
router.get("/chats/:chatId", (req: Request, res: Response) => {
  const platform = req.query.platform as ChatPlatform;
  const chatId = req.params.chatId;

  const chat = getChat(platform, chatId);
  if (!chat) {
    return res.status(404).json({ error: "Чат не найден" });
  }

  const formattedMessages = chat.messages.map((msg, index) =>
    formatMessage(msg, index)
  );
  res.json(formattedMessages);
});

/**
 * POST /chats/:chatId/reply
 * Отправка ответа от оператора
 */
//@ts-expect-error
router.post("/chats/:chatId/reply", async (req: Request, res: Response) => {
  const platform = req.body.platform as ChatPlatform;
  if (!platform) {
    return res.status(400).json({ error: "Platform is required in query" });
  }
  const chatId = req.params.chatId;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    saveMessage(platform, chatId, "Operator", {
      role: "assistant",
      content: text,
      timestamp: new Date(),
    });

    await sendMessageToClient(platform, chatId, text);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /chats/:chatId/send
 * AI-режим: пользователь пишет → AI отвечает
 */
//@ts-expect-error
router.post("/chats/:chatId/send", async (req: Request, res: Response) => {
  const platform = req.body.platform as ChatPlatform;
  const chatId = req.params.chatId;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const chat = getChat(platform, chatId);
    if (!chat) return res.status(404).json({ error: "Чат не найден" });

    // Сохраняем сообщение пользователя
    saveMessage(platform, chatId, "User", {
      role: "user",
      content: text,
      timestamp: new Date(),
    });

    // Имитация контекста
    const fakeCtx = {
      from: { first_name: chat.userName },
      session: {
        chatHistory: chat.messages || [],
      },
    };

    // Получаем ответ от AI
    const response = await getAIResponse(
      fakeCtx as any,
      text,
      `Клиент ${chat.userName}`
    );

    // Сохраняем ответ
    saveMessage(platform, chatId, "Bot", {
      role: "assistant",
      content: response,
      timestamp: new Date(),
    });

    await sendMessageToClient(platform, chatId, response);

    res.json({ success: true, reply: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
