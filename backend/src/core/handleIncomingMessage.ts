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

  // Сохраняем сообщение
  saveMessage(platform, chatId, userName, {
    role: "user",
    content: text,
    timestamp: now,
  });

  console.log(`[INCOMING] [${platform}] ${chatId} <- ${text}`);

  // Устанавливаем уведомление
  const chat = getChat(platform, chatId);
  if (!chat) {
    console.warn(
      `[WARN] Чат ${chatId} не найден в chatStore после saveMessage`
    );
    return;
  }

  // Ставим флаг только для входящих от пользователя
  chat.notification = true;
  broadcastAll({
    type: "new_chat",
    payload: {
      platform,
      chatId,
      userName: chat.userName,
      updatedAt: chat.updatedAt,
      status: chat.status,
      mode: chat.mode,
      avatar: chat.avatar,
      notification: true,
      lastMessage: chat.lastMessage,
      messages: chat.messages.slice(-5),
    },
  });

  console.log("📤 Broadcast with notification:", {
    chatId,
    platform,
    notification: chat.notification,
  });
  // Шлём обновление на фронт
  broadcastTo(chatId, platform, {
    type: "new_message",
    payload: {
      sender: "user",
      content: text,
      timestamp: now,
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
