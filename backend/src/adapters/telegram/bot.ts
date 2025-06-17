import dotenv from "dotenv";
dotenv.config();

import { Bot, session } from "grammy";
import { MyContext, SessionData } from "../../types";
import { getAIResponse } from "../../services/ai-service";
import { saveMessage } from "../../chatStore";
import { setupRepairScenario, handleRepairSteps } from "../../scenarios/repair";
import {
  setupCartridgeScenario,
  handleCartridgeStep,
} from "../../scenarios/cartridge";
import { setupGreeting } from "../../scenarios/greeting";
import { setupPurchase } from "../../scenarios/purchase";
import { broadcastTo } from "../../ws/socket-server";

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

// Инициализация всех сценариев
setupGreeting(bot);
setupRepairScenario(bot);
setupCartridgeScenario(bot);
setupPurchase(bot);

// Команда для активации AI-режима
bot.command("ai", async (ctx) => {
  ctx.session.scenario = "ai_chat";
  await ctx.reply("Режим AI-консультанта активирован. Задавайте вопросы!");
});

// Обработка текстовых сообщений
bot.on("message:text", async (ctx: MyContext) => {
  if (!ctx.message?.text) return;
  if (!ctx.chat) return;

  const message = ctx.message.text;
  const from = ctx.from;
  const firstName = from?.first_name ?? "Пользователь";
  const lastName = from?.last_name ?? "";

  // Инициализация истории чата
  ctx.session.chatHistory ||= [];
  ctx.session.chatHistory.push({
    role: "user",
    content: message,
    timestamp: new Date(),
  });

  // Сохраняем сообщение в чат-сторе
  if (!ctx.from) return;
  saveMessage(
    "telegram",
    ctx.chat.id.toString(),
    `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`, // username
    {
      role: "user",
      content: ctx.message.text,
      timestamp: new Date(),
    }
  );
  broadcastTo(ctx.chat.id.toString(), {
    type: "new_message",
    payload: {
      sender: "bot", // или "user", "operator"
      content: "Пример текста",
      timestamp: new Date(),
    },
  });
  // Если включён сценарий ремонта
  if (ctx.session.scenario === "repair") {
    return await handleRepairSteps(ctx);
  }

  // Если включён сценарий картриджа
  if (ctx.session.scenario === "cartridge") {
    return await handleCartridgeStep(ctx);
  }

  // Если другой сценарий, кроме AI — игнорируем обычную обработку
  if (ctx.session.scenario && ctx.session.scenario !== "ai_chat") return;

  // AI-режим или обычная обработка
  try {
    const response = await getAIResponse(
      ctx,
      message,
      `Клиент: ${firstName} ${lastName}`
    );

    // Триггеры перехода в сценарии
    if (response.includes("[TRIGGER_REPAIR]")) {
      ctx.session.scenario = "repair";
      ctx.session.step = "type";
      return ctx.reply("Давайте оформим заявку на ремонт...");
    }
    if (response.includes("[TRIGGER_CARTRIDGE]")) {
      ctx.session.scenario = "cartridge";
      ctx.session.step = undefined; // если нужен стартовый шаг
      return ctx.reply("Укажите модель картриджа или принтера:");
    }
    if (response.includes("[TRIGGER_PURCHASE]")) {
      ctx.session.scenario = "purchase";
      ctx.session.step = undefined;
      return ctx.reply("Выберите технику для покупки или задайте вопрос.");
    }

    // Обычный ответ от AI
    await ctx.reply(response);
  } catch (err) {
    console.error("AI error:", err);
    await ctx.reply("Произошла ошибка, попробуйте позже");
  }
});
