import { sendTelegramMessage } from "../adapters/telegram/telegram-adapter";
import { sendWhatsAppMessage } from "../adapters/whatsapp/whatsapp-adapter";
import { getChat, ChatPlatform } from "../store/chatStore";
import dotenv from "dotenv";

dotenv.config();

export async function sendMessageToClient(
  platform: ChatPlatform,
  chatId: string,
  text: string
): Promise<void> {
  const WA_MANAGER_NUMBER = process.env.WA_MANAGER_NUMBER;

  console.log(platform, chatId, text);

  if (platform === "whatsapp" && chatId === WA_MANAGER_NUMBER) {
    return await sendWhatsAppMessage(chatId, text);
  }

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
