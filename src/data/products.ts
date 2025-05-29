import { bot } from "../bot";

// data/products.ts
export const PRODUCTS = [
  {
    name: "Принтер Canon LBP 2900",
    price: "50 000тг",
    desc: "Лазерный, монохромный, 40 стр/мин",
  },
  // ...
];

// В сценарии покупки:
bot.hears("💻 Купить технику", async (ctx) => {
  const productsText = PRODUCTS.map(
    (p) => `<b>${p.name}</b>\n${p.desc}\nЦена: ${p.price}\n`
  ).join("\n");

  await ctx.reply(`🖨️ Доступная техника:\n\n${productsText}`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Оставить заявку", callback_data: "order_tech" }],
      ],
    },
  });
});
