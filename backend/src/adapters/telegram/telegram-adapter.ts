import { bot } from "./bot";

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<void> {
  await bot.api.sendMessage(Number(chatId), text);
}
