// scenarios/repair.ts
import { Bot } from "grammy";
import { MyContext } from "../types";
import { saveRepairRequest } from "../utils/saveRepairRequest";
import { resetSession } from "../utils/sessions";

export function setupRepairScenario(bot: Bot<MyContext>) {
  bot.hears("🛠️ Ремонт техники", async (ctx) => {
    ctx.session.scenario = "repair";
    ctx.session.step = "type";

    await ctx.reply("Какая техника требует ремонта?", {
      reply_markup: {
        keyboard: [["Принтер/МФУ"], ["Компьютер"], ["Сервер"], ["Другое"]],
        resize_keyboard: true,
      },
    });
  });
}

export async function handleRepairSteps(ctx: MyContext) {
  switch (ctx.session.step) {
    case "type":
      ctx.session.deviceType = ctx.message?.text || "";
      ctx.session.step = "problem";
      await ctx.reply("Опишите проблему:");
      break;

    case "problem":
      ctx.session.problem = ctx.message?.text || "";
      ctx.session.step = "contact";
      await ctx.reply("Оставьте контакт для связи:", {
        reply_markup: { remove_keyboard: true },
      });
      break;

    case "contact":
      await saveRepairRequest(ctx);
      await ctx.reply("✅ Заявка принята! Мастер свяжется в течение 30 минут.");
      resetSession(ctx);
      break;
  }
}
