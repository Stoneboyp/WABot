// services/notifications.ts
import dotenv from "dotenv";
import { AIMessage, ChatPlatform, RepairRequest } from "../types";
import { sendMessageToClient } from "../core/message-bus";

dotenv.config();

export async function notifyManager(
  platform: ChatPlatform,
  aiMessage: AIMessage
) {
  const MANAGER_CHAT_ID = process.env.TG_MANAGER_ID;
  const WA_MANAGER_NUMBER = process.env.WA_MANAGER_NUMBER;
  let managerChatId: string | undefined;

  if (platform === "telegram") {
    managerChatId = process.env.TG_MANAGER_ID;
  } else if (platform === "whatsapp") {
    managerChatId = process.env.WA_MANAGER_NUMBER;
  }

  if (!managerChatId) {
    console.error(`❌ Менеджерский chatId для платформы ${platform} не найден`);
    return;
  }

  const { request_id, service, deviceType, model, problem, address } =
    aiMessage.data;

  const lines = [
    `📢 Новая заявка №${request_id || "-"}`,
    `Услуга: ${service}`,
    deviceType && `Тип устройства: ${deviceType}`,
    model && `Модель: ${model}`,
    problem && `Проблема: ${problem}`,
    address && `Адрес: ${address}`,
  ].filter(Boolean);

  const text = lines.join("\n");

  try {
    await sendMessageToClient(platform, managerChatId, text);
  } catch (err) {
    console.error("❌ Ошибка при отправке уведомления менеджеру:", err);
  }
}
