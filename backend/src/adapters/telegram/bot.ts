import dotenv from "dotenv";
dotenv.config();

import { Bot, Context, session } from "grammy";
import { SessionFlavor } from "grammy";
import { SessionData } from "../../types";
import { handleIncomingMessage } from "../../core/handleIncomingMessage";

type MyGrammyContext = Context & SessionFlavor<SessionData>;

export const bot = new Bot<MyGrammyContext>(process.env.TG_TOKEN!);

bot.use(
  session({
    initial(): SessionData {
      return { chatHistory: [] };
    },
  })
);

bot.on("message:text", async (ctx) => {
  if (!ctx.message?.text || !ctx.chat) return;

  const message = ctx.message.text;
  const chatId = ctx.chat.id.toString();
  const userName = `${ctx.from?.first_name || ""} ${
    ctx.from?.last_name || ""
  }`.trim();

  ctx.session.chatHistory ||= [];

  await handleIncomingMessage({
    chatId,
    platform: "telegram",
    userName,
    text: message,
    history: ctx.session.chatHistory,
  });

  ctx.session.chatHistory.push({
    role: "user",
    content: message,
    timestamp: new Date(),
  });
});
