import { bot } from "../adapters/telegram/bot";

// data/faq.ts
export const FAQ = {
  "Срочный ремонт": "Оказываем срочный ремонт в течение 2 часов на выезд",
  Гарантия: "Даем гарантию на все виды ремонта",
  "Стоимость заправки": "От 4000тг за картридж, так же работаем на выезд",
  "Где находитесь?": "Мы находимся г.Астана, Иманова 19",
};

// В обработчике:
bot.hears("❓ Частые вопросы", (ctx) => {
  let response = "Частые вопросы:\n\n";
  Object.entries(FAQ).forEach(([q, a]) => {
    response += `▪ <b>${q}</b>: ${a}\n\n`;
  });
  ctx.reply(response, { parse_mode: "HTML" });
});
