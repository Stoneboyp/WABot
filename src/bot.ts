import { Bot } from "grammy";
import dotenv from "dotenv"


dotenv.config()

const token = process.env.TG_TOKEN;
if (!token) throw new Error("TG_TOKEN is not defined");

const bot = new Bot(token);
// Теперь вы можете зарегистрировать слушателей на объекте вашего бота `bot`.
// grammY будет вызывать слушателей, когда пользователи будут отправлять сообщения вашему боту.

// Обработайте команду /start.
bot.command("start", (ctx) =>
  ctx.reply("Добро пожаловать. Запущен и работает!")
);
// Обработайте другие сообщения.
bot.on("message", (ctx) => ctx.reply("Получил другое сообщение!"));

// Теперь, когда вы указали, как обрабатывать сообщения, вы можете запустить своего бота.
// Он подключится к серверам Telegram и будет ждать сообщений.

// Запустите бота.
bot.start();
