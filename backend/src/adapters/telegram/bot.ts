import dotenv from "dotenv";
dotenv.config();

import { Bot, session } from "grammy";
import { MyContext, SessionData } from "../../types";
import { getAIResponse } from "../../services/ai-service";
import { saveMessage } from "../../chatStore";
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
      sender: "user", // или bot/operator по логике
      content: ctx.message.text,
      timestamp: new Date(),
    },
  });

  // AI-режим или обычная обработка
  try {
    const response = await getAIResponse(
      ctx,
      message,
      `Клиент: ${firstName} ${lastName}`
    );
    // Обычный ответ от AI
    await ctx.reply(response);
    broadcastTo(ctx.chat.id.toString(), {
      type: "new_message",
      payload: {
        sender: "bot",
        content: response,
        timestamp: new Date(),
      },
    });
  } catch (err) {
    console.error("AI error:", err);
    await ctx.reply("Произошла ошибка, попробуйте позже");
  }
});
