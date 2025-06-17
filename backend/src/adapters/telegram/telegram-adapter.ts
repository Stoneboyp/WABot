import { bot } from "./bot";

export async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<void> {
  await bot.api.sendMessage(chatId, text);
}
