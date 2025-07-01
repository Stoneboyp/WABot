// core/message-bus.ts
import { sendTelegramMessage } from "../adapters/telegram/telegram-adapter";
import { sendWhatsAppMessage } from "../adapters/whatsapp/whatsapp-adapter";
import { getChat, ChatPlatform } from "../chatStore";

export async function sendMessageToClient(
  platform: ChatPlatform,
  chatId: string,
  text: string
): Promise<void> {
  const chat = getChat(platform, chatId);
  if (!chat) throw new Error("Chat not found");
  console.log("🚨 Платформа:", platform);
  if (platform === "telegram") {
    return await sendTelegramMessage(chatId, text);
  }

  if (platform === "whatsapp") {
    return await sendWhatsAppMessage(chatId, text);
  }

  if (platform === "other") {
    console.log("Webchat:", chatId, text);
    return;
  }

  throw new Error("Unsupported platform");
}
