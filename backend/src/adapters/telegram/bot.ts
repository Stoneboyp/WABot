import dotenv from "dotenv";
dotenv.config();

import { Bot, session } from "grammy";
import { MyContext, SessionData } from "../../types";
import { getAIResponse } from "../../services/ai-service";
import { getChat, saveMessage } from "../../chatStore";
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

  const chatId = ctx.chat.id.toString();
  const platform = "telegram";

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
    platform,
    chatId,
    `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`,
    {
      role: "user",
      content: message,
      timestamp: new Date(),
    }
  );

  broadcastTo(chatId, {
    type: "new_message",
    payload: {
      sender: "user",
      content: message,
      timestamp: new Date(),
    },
  });

  // ⛔ Проверка перед вызовом AI
  const chat = getChat(platform, chatId);
  if (chat?.mode === "operator") {
    console.log(`🛑 Chat ${chatId} в режиме operator — AI не отвечает`);
    return;
  }

  // 🤖 AI-режим
  try {
    const response = await getAIResponse(
      ctx,
      message,
      `Клиент: ${firstName} ${lastName}`
    );

    await ctx.reply(response);

    broadcastTo(chatId, {
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
