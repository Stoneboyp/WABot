import { Bot } from "grammy";
import { MyContext } from "../types";
import { resetSession } from "../utils/sessions";

export function setupCartridgeScenario(bot: Bot<MyContext>) {
  bot.hears("🖨️ Заправка картриджей", async (ctx) => {
    ctx.session.scenario = "cartridge";
    await ctx.reply("Укажите модель картриджа или принтера:");
  });
}

export async function handleCartridgeStep(ctx: MyContext) {
  const model = ctx.message?.text || "не указано";
  await ctx.reply(`Заправка ${model}:\n▪ Стоимость: 8000тг\n▪ Срок: 1 день`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Подтвердить", callback_data: "confirm_cartridge" }],
      ],
    },
  });

  resetSession(ctx);
}
