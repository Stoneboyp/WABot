// telegram/bot.ts
import dotenv from "dotenv";
dotenv.config();

import { Bot, session } from "grammy";
import { MyContext, SessionData } from "../../types";
import { handleIncomingMessage } from "../../core/handleIncomingMessage";

export const bot = new Bot<MyContext>(process.env.TG_TOKEN!);

bot.use(
  session({
    initial(): SessionData {
      return { chatHistory: [] };
    },
  })
);

bot.on("message:text", async (ctx: MyContext) => {
  if (!ctx.message?.text || !ctx.chat) return;

  const message = ctx.message.text;
  const chatId = ctx.chat.id.toString();
  const userName = `${ctx.from?.first_name || ""} ${
    ctx.from?.last_name || ""
  }`.trim();

  await handleIncomingMessage({
    chatId,
    platform: "telegram",
    userName,
    text: message,
    history: ctx.session.chatHistory,
  });

  // Обновляем историю
  ctx.session.chatHistory ||= [];
  ctx.session.chatHistory.push({
    role: "user",
    content: message,
    timestamp: new Date(),
  });
});
