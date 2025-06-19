import express, { Request, Response } from "express";
import { getAIResponse } from "../services/ai-service";
import { saveMessage, getChat, getAllChats, setChatMode } from "../chatStore";
import { sendMessageToClient } from "../core/message-bus";
import { formatMessage } from "../utils/formatMessage";
import { ChatPlatform } from "../chatStore";
import { handleWebhookFromPlatform } from "../ws/socket-server";

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
  const { text, mode } = req.body;

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
    console.log(
      `[MODE SERVER CHECK] chatId=${chatId}, platform=${platform}, mode=${mode}`
    );
    if (mode === "operator") {
      console.log("🛑 Operator mode active — AI won't respond.");
      return res.json({ success: true, reply: null });
    }
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

//@ts-expect-error
router.post("/chats/:chatId/mode", (req: Request, res: Response) => {
  const platform = req.body.platform as ChatPlatform;
  const mode = req.body.mode as "operator" | "ai";
  const chatId = req.params.chatId;

  if (!mode || !platform) {
    return res.status(400).json({ error: "Missing mode or platform" });
  }

  setChatMode(platform, chatId, mode);
  console.log(
    `🔄 Chat mode updated: chatId=${chatId}, platform=${platform}, new mode=${mode}`
  );
  res.json({ success: true });
});

export default router;

//temp use pooling
// router.post("/webhook/:platform", (req, res) => {
//   const platform = req.params.platform;
//   handleWebhookFromPlatform(platform, req.body);
//   res.sendStatus(200);
// });
