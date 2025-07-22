// api/chat-api.ts
import express, { Request, Response } from "express";
import { getAIResponse } from "../services/ai-service";
import {
  saveMessage,
  getChat,
  getAllChats,
  setChatMode,
  chatStore,
} from "../store/chatStore";
import { sendMessageToClient } from "../core/message-bus";
import { formatMessage } from "../utils/formatMessage";
import { ChatPlatform } from "../store/chatStore";
import {
  broadcastAll,
  broadcastTo,
  handleWebhookFromPlatform,
} from "../ws/socket-server";
import { MyContext } from "../types";

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
    notification: chat.notification,
    lastMessage: chat.lastMessage,
  }));

  res.json(chats);
});

/**
 * GET /chats/:chatId?platform=telegram
 * Получение истории сообщений по чату
 */
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

    const chat = getChat(platform, chatId);

    if (chat) {
      broadcastAll({
        type: "new_chat",
        payload: {
          chatId,
          platform,
          userName: chat.userName,
          avatar: chat.avatar,
          updatedAt: chat.updatedAt,
          status: chat.status,
          notification: chat.notification,
          lastMessage: chat.lastMessage,
        },
      });
    }

    await sendMessageToClient(platform, chatId, text);
    console.log("📤 [REPLY] Broadcasting operator reply:", {
      chatId,
      platform,
      sender: "operator",
      content: text,
      timestamp: new Date(),
      lastMessage: text,
    });

    broadcastTo(chatId, platform, {
      type: "new_message",
      payload: {
        sender: "operator",
        content: text,
        timestamp: new Date(),
        lastMessage: text,
      },
    });

    console.log("✅ [REPLY] Broadcast sent");

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
    const fakeCtx: MyContext = {
      chatId,
      platform,
      userName: chat.userName,
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

    // 🆕 Обновим список чатов для ChatList (реалтайм)
    const updatedChat = getChat(platform, chatId);
    if (updatedChat) {
      broadcastAll({
        type: "new_chat",
        payload: {
          chatId,
          platform,
          userName: updatedChat.userName,
          avatar: updatedChat.avatar,
          updatedAt: updatedChat.updatedAt,
          status: updatedChat.status,
          notification: updatedChat.notification,
          lastMessage: updatedChat.lastMessage,
        },
      });
    }

    await sendMessageToClient(platform, chatId, response);

    broadcastTo(chatId, platform, {
      type: "new_message",
      payload: {
        chatId,
        platform,
        sender: "bot",
        content: response,
        timestamp: new Date().toISOString(),
        lastMessage: response,
      },
    });
    res.json({ success: true, reply: response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

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

router.post(
  "/chats/:platform/:chatId/clear-notification",
  (req: Request, res: Response) => {
    const { platform, chatId } = req.params;
    const chat = chatStore.get(`${platform}:${chatId}`);
    if (chat) {
      chat.notification = false;
      return res.status(200).json({ success: true });
    }
    res.status(404).json({ error: "Chat not found" });
  }
);

export default router;

//temp use pooling
// router.post("/webhook/:platform", (req, res) => {
//   const platform = req.params.platform;
//   handleWebhookFromPlatform(platform, req.body);
//   res.sendStatus(200);
// });
