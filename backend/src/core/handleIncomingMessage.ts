import { getAIResponse } from "../services/ai-service";
import { getChat, saveMessage } from "../chatStore";
import { broadcastTo } from "../ws/socket-server";
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
  saveMessage(platform, chatId, userName, {
    role: "user",
    content: text,
    timestamp: new Date(),
  });
  console.log(`[INCOMING] [${platform}] ${chatId} <- ${text}`);
  broadcastTo(chatId, platform, {
    type: "new_message",
    payload: {
      sender: "user",
      content: text,
      timestamp: new Date(),
    },
  });

  const chat = getChat(platform, chatId);
  if (!chat) {
    console.warn(
      `[WARN] Чат ${chatId} не найден в chatStore после saveMessage`
    );
    return;
  }
  if (chat?.mode === "operator") {
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

    await sendMessageToClient(platform, chatId, response);

    broadcastTo(chatId, platform, {
      type: "new_message",
      payload: {
        sender: "bot",
        content: response,
        timestamp: new Date(),
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
