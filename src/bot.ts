import dotenv from "dotenv";
dotenv.config();

import { Bot, session } from "grammy";
import { MyContext, SessionData } from "./types";
import { getAIResponse } from "./services/ai-service";

import { setupRepairScenario, handleRepairSteps } from "./scenarios/repair";
import {
  setupCartridgeScenario,
  handleCartridgeStep,
} from "./scenarios/cartridje";
import { setupGreeting } from "./scenarios/greeting";
import { setupPurchase } from "./scenarios/purchase";

export const bot = new Bot<MyContext>(process.env.TG_TOKEN!);

bot.use(
  session({
    initial(): SessionData {
      return {
        chatHistory: [],
      };
    },
  })
);

setupGreeting(bot);
setupRepairScenario(bot);
setupCartridgeScenario(bot);
setupPurchase(bot);

bot.command("ai", async (ctx) => {
  ctx.session.scenario = "ai_chat";
  await ctx.reply("Режим AI-консультанта активирован. Задавайте вопросы!");
});

bot.on("message:text", async (ctx) => {
  if (ctx.session.scenario === "repair") {
    return await handleRepairSteps(ctx);
  }

  if (ctx.session.scenario === "cartridge") {
    return await handleCartridgeStep(ctx);
  }

  if (ctx.session.scenario && ctx.session.scenario !== "ai_chat") return;

  try {
    const response = await getAIResponse(
      ctx,
      ctx.message.text,
      `Клиент: ${ctx.from?.first_name} ${ctx.from?.last_name || ""}`
    );

    if (response.includes("[TRIGGER_REPAIR]")) {
      ctx.session.scenario = "repair";
      ctx.session.step = "type";
      return ctx.reply("Давайте оформим заявку на ремонт...");
    }
    if (response.includes("[TRIGGER_CARTRIDGE]")) {
      ctx.session.scenario = "cartridge";
      return ctx.reply("Укажите модель картриджа или принтера:");
    }
    if (response.includes("[TRIGGER_PURCHASE]")) {
      ctx.session.scenario = "purchase";
      return ctx.reply("Выберите технику для покупки или задайте вопрос.");
    }

    await ctx.reply(response);
  } catch (err) {
    console.error("AI error:", err);
    await ctx.reply("Произошла ошибка, попробуйте позже");
  }
});

bot.start();
