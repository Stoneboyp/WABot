// core/handleIncomingMessage.ts
import { getAIResponse } from "../services/ai-service";
import { getChat, saveMessage } from "../store/chatStore";
import { broadcastTo } from "../ws/socket-server";
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
import { detectScenario } from "../utils/scenarioDetector";
import { AIMessage, ChatMessage } from "../types";
import { notifyManager } from "../services/notification";
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
  // Лимит сообщений от пользователя
  const MAX_MESSAGES_FROM_USER = 25;

  // Если сессия уже заблокирована — не отвечаем
  if (chat.session.locked) {
    logger.info(
      `[${platform}:${chatId}] 🚫 Заблокирован — сообщение проигнорировано.`
    );
    return;
  }

  const userMessageCount = chat.messages.filter(
    (msg) => msg.role === "user"
  ).length;

  if (userMessageCount > MAX_MESSAGES_FROM_USER) {
    const limitMsg =
      "Пожалуйста, дождитесь оператора или свяжитесь с нами по телефону";
    const botMessage: ChatMessage = {
      role: "assistant",
      content: limitMsg,
      timestamp: new Date(),
    };

    chat.messages.push(botMessage);
    chat.lastMessage = limitMsg;
    chat.updatedAt = new Date();
    chat.mode = "operator";
    chat.notification = true;
    chat.session.locked = true;

    await sendMessageToClient(platform, chatId, limitMsg);

    broadcastTo(chatId, platform, {
      type: "new_message",
      payload: {
        sender: "bot",
        content: limitMsg,
        timestamp: new Date(),
        lastMessage: limitMsg,
      },
    });

    broadcastTo("admin", "admin", {
      type: "chat_updated",
      payload: {
        chatId,
        platform,
        lastMessage: limitMsg,
        updatedAt: new Date(),
        notification: true,
      },
    });

    logger.info(
      `[${platform}:${chatId}] 🚫 Превышен лимит (${userMessageCount}), включён режим оператора.`
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
      session: { chatHistory: history, ...(chat.session || {}) },
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
    let aiMessage: AIMessage;
    try {
      aiMessage = JSON.parse(
        aiRaw
          .trim()
          .replace(/^```(?:json)?\n?/, "")
          .replace(/```$/, "")
      );
    } catch (e) {
      console.error("❌ Не удалось распарсить JSON из AI:", aiRaw);
      throw new Error("AI ответ в неверном формате");
    }
    console.log(aiMessage);
    if (aiMessage.step === "completed") {
      ctx.session.confirmed = true;
      chat.session = ctx.session;
      await sendMessageToClient(platform, chatId, aiMessage.response);

      logSessionEvent(chatId, platform, {
        type: "confirmation",
        content: aiMessage.response,
        timestamp: new Date().toISOString(),
      });

      notifyManager(platform, aiMessage, chatId);

      return;
    }

    if (aiMessage.step === "fallback") {
      const fallbackMsg =
        aiMessage.response ||
        "Спасибо за сообщение! Мы ответим вам, как только освободится оператор.";

      chat.session = ctx.session;
      chat.mode = "operator";
      chat.notification = true;
      chat.lastMessage = fallbackMsg;
      chat.updatedAt = new Date();

      saveMessage(platform, chatId, "Bot", {
        role: "assistant",
        content: fallbackMsg,
        timestamp: new Date(),
      });

      await sendMessageToClient(platform, chatId, fallbackMsg);

      broadcastTo(chatId, platform, {
        type: "new_message",
        payload: {
          sender: "bot",
          content: fallbackMsg,
          timestamp: new Date(),
          lastMessage: fallbackMsg,
        },
      });

      broadcastTo("admin", "admin", {
        type: "chat_updated",
        payload: {
          chatId,
          platform,
          lastMessage: fallbackMsg,
          updatedAt: new Date(),
          notification: true,
        },
      });

      logSessionEvent(chatId, platform, {
        type: "fallback_ai",
        content: fallbackMsg,
        timestamp: new Date().toISOString(),
      });

      logger.info(
        `[${platform}:${chatId}] 🔄 Переключение на оператора (AI fallback)`
      );

      return;
    }
    await sendMessageToClient(platform, chatId, aiMessage.response);

    const validated = validateAIResponse(aiMessage.response, kbAnswer);
    const finalResponse = postProcessResponse(validated);
    chat.session = ctx.session;
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
    logger.debug(`[${platform}:${chatId}] 💾 Session state:`, ctx.session);

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
