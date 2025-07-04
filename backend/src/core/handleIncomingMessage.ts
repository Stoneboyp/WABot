// core/handleIncomingMessage.ts
import { getAIResponse } from "../services/ai-service";
import { getChat, saveMessage } from "../chatStore";
import { broadcastAll, broadcastTo } from "../ws/socket-server";
import { sendMessageToClient } from "./message-bus";
import {
  sanitizeHistory,
  validateAIResponse,
  postProcessResponse,
  isPotentialServiceQuestion,
  fallbackResponse,
} from "./guardRails";
import { searchKnowledgeBase } from "../services/knowledge-base";
import logger from "../core/logger";
import { logSessionEvent } from "../core/sessionLogger";

interface HandleIncomingMessageOptions {
  chatId: string;
  platform: "telegram" | "whatsapp" | "other";
  userName: string;
  text: string;
  history?: { role: "user" | "assistant"; content: string; timestamp: Date }[];
}

export async function handleIncomingMessage({
  chatId,
  platform,
  userName,
  text,
  history = [],
}: HandleIncomingMessageOptions): Promise<void> {
  const now = new Date();

  // 1. Сохраняем сообщение
  saveMessage(platform, chatId, userName, {
    role: "user",
    content: text,
    timestamp: now,
  });
  logger.info(`[${platform}:${chatId}] 💬 Входящее: "${text}" от ${userName}`);

  logSessionEvent(chatId, platform, {
    type: "incoming_user_message",
    userName,
    content: text,
    timestamp: now.toISOString(),
  });

  console.log(`[INCOMING] [${platform}] ${chatId} <- ${text}`);

  // 2. Получаем обновленный чат
  const chat = getChat(platform, chatId);
  if (!chat) {
    console.warn(
      `[WARN] Чат ${chatId} не найден в chatStore после saveMessage`
    );
    return;
  }

  // 3. Обновляем lastMessage и notification
  chat.lastMessage = text;
  chat.updatedAt = new Date();
  chat.notification = true;

  // 4. Отправляем специальное обновление для списка чатов
  broadcastTo("admin", "admin", {
    type: "chat_updated",
    payload: {
      chatId,
      platform,
      lastMessage: text,
      updatedAt: now.toISOString(),
      notification: true,
      // Дополнительные поля при необходимости
      userName: chat.userName,
      avatar: chat.avatar,
    },
  });

  // 5. Отправляем полное сообщение в чат (если открыт)
  broadcastTo(chatId, platform, {
    type: "new_message",
    payload: {
      sender: "user",
      content: text,
      timestamp: now.toISOString(),
      lastMessage: text,
    },
  });

  if (chat.mode === "operator") {
    logger.info(`[${platform}:${chatId}] 🛑 AI не отвечает (operator mode)`);
    return;
  }

  try {
    const ctx = {
      from: { first_name: userName },
      session: { chatHistory: history },
    };

    // 1. Пробуем найти ответ в базе знаний
    const kbAnswer = await searchKnowledgeBase(text);

    if (kbAnswer) {
      logger.info(`[${platform}:${chatId}] 📚 Ответ из базы знаний`);

      logSessionEvent(chatId, platform, {
        type: "kb_answer",
        content: kbAnswer,
        timestamp: new Date().toISOString(),
      });
      saveMessage(platform, chatId, "Bot", {
        role: "assistant",
        content: kbAnswer,
        timestamp: new Date(),
      });

      chat.lastMessage = kbAnswer;
      chat.updatedAt = new Date();

      broadcastTo("admin", "admin", {
        type: "chat_updated",
        payload: {
          chatId,
          platform,
          lastMessage: kbAnswer,
          updatedAt: new Date(),
          notification: true,
        },
      });

      await sendMessageToClient(platform, chatId, kbAnswer);
      broadcastTo(chatId, platform, {
        type: "new_message",
        payload: {
          sender: "bot",
          content: kbAnswer,
          timestamp: new Date(),
          lastMessage: kbAnswer,
        },
      });

      return;
    }

    // 2. Если вопрос похож на запрос услуги, но KB не сработала — даём fallback
    if (isPotentialServiceQuestion(text)) {
      const fallback = fallbackResponse(text);
      logger.info(
        `[${platform}:${chatId}] 🔙 Fallback-ответ по ключевой фразе`
      );

      logSessionEvent(chatId, platform, {
        type: "fallback",
        content: fallback,
        timestamp: new Date().toISOString(),
      });
      saveMessage(platform, chatId, "Bot", {
        role: "assistant",
        content: fallback,
        timestamp: new Date(),
      });

      chat.lastMessage = fallback;
      chat.updatedAt = new Date();

      broadcastTo("admin", "admin", {
        type: "chat_updated",
        payload: {
          chatId,
          platform,
          lastMessage: fallback,
          updatedAt: new Date(),
          notification: true,
        },
      });

      await sendMessageToClient(platform, chatId, fallback);
      broadcastTo(chatId, platform, {
        type: "new_message",
        payload: {
          sender: "bot",
          content: fallback,
          timestamp: new Date(),
          lastMessage: fallback,
        },
      });

      return;
    }

    // 3. Вызываем AI и применяем защиты
    const filteredHistory = sanitizeHistory(ctx as any, kbAnswer);
    const aiRaw = await getAIResponse(
      { ...ctx, session: { chatHistory: filteredHistory } } as any,
      text,
      `Клиент: ${userName}`
    );
    const validated = validateAIResponse(aiRaw, kbAnswer);
    const finalResponse = postProcessResponse(validated);

    saveMessage(platform, chatId, "Bot", {
      role: "assistant",
      content: finalResponse,
      timestamp: new Date(),
    });

    chat.lastMessage = finalResponse;
    chat.updatedAt = new Date();

    broadcastTo("admin", "admin", {
      type: "chat_updated",
      payload: {
        chatId,
        platform,
        lastMessage: finalResponse,
        updatedAt: new Date(),
        notification: true,
      },
    });

    await sendMessageToClient(platform, chatId, finalResponse);
    broadcastTo(chatId, platform, {
      type: "new_message",
      payload: {
        sender: "bot",
        content: finalResponse,
        timestamp: new Date(),
        lastMessage: finalResponse,
      },
    });
    logger.info(`[${platform}:${chatId}] 🤖 AI ответил: "${finalResponse}"`);

    logSessionEvent(chatId, platform, {
      type: "ai_answer",
      content: finalResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`[${platform}:${chatId}] ❌ Ошибка AI: ${err}`);

    logSessionEvent(chatId, platform, {
      type: "error",
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });

    await sendMessageToClient(
      platform,
      chatId,
      "Произошла ошибка, попробуйте позже"
    );
  }
}
