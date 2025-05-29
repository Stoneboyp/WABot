// services/notifications.ts
import { bot } from "../bot";
import dotenv from "dotenv";
import { RepairRequest } from "../types";

dotenv.config();

export async function notifyManager(request: RepairRequest) {
  const MANAGER_CHAT_ID = process.env.TG_MANAGER_ID;
  if (!MANAGER_CHAT_ID) {
    console.error("MANAGER_CHAT_ID is not defined");
    return;
  }
  const text = `📢 Новая заявка!\nТип: ${request.type}\nПроблема: ${request.problem}\nКонтакт: ${request.contact}`;

  await bot.api.sendMessage(MANAGER_CHAT_ID, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Принять в работу", callback_data: `accept_${request.id}` }],
      ],
    },
  });
}
