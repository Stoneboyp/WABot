import { getAIResponse } from "../services/ai-service";
import { getChat, saveMessage } from "../chatStore";
import { broadcastAll, broadcastTo } from "../ws/socket-server";
import { sendMessageToClient } from "./message-bus";

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
    console.log(`🛑 Chat ${chatId} в режиме operator — AI не отвечает`);
    return;
  }

  try {
    const ctx = {
      from: { first_name: userName },
      session: { chatHistory: history },
    };

    const response = await getAIResponse(
      ctx as any,
      text,
      `Клиент: ${userName}`
    );

    // Сохраняем ответ AI
    saveMessage(platform, chatId, "Bot", {
      role: "assistant",
      content: response,
      timestamp: new Date(),
    });

    // Обновляем lastMessage для ответа бота
    chat.lastMessage = response;
    chat.updatedAt = new Date();

    // Отправляем обновление для списка чатов
    broadcastTo("admin", "admin", {
      type: "chat_updated",
      payload: {
        chatId,
        platform,
        lastMessage: response,
        updatedAt: new Date(),
        notification: true,
      },
    });

    // Отправляем ответ в чат
    await sendMessageToClient(platform, chatId, response);
    broadcastTo(chatId, platform, {
      type: "new_message",
      payload: {
        sender: "bot",
        content: response,
        timestamp: new Date(),
        lastMessage: response,
      },
    });
  } catch (err) {
    console.error("AI error:", err);
    await sendMessageToClient(
      platform,
      chatId,
      "Произошла ошибка, попробуйте позже"
    );
  }
}
