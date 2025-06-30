// // scenarios/purchase.ts
// import { Bot } from "grammy";
// import { MyContext } from "../types";
// import { PRODUCTS } from "../data/products";

// export function setupPurchase(bot: Bot<MyContext>) {
//   bot.hears("💻 Купить технику", async (ctx) => {
//     const productsText = PRODUCTS.map(
//       (p) => `<b>${p.name}</b>\n${p.desc}\nЦена: ${p.price}\n`
//     ).join("\n");

//     await ctx.reply(`🖨️ Доступная техника:\n\n${productsText}`, {
//       parse_mode: "HTML",
//       reply_markup: {
//         inline_keyboard: [
//           [{ text: "Оставить заявку", callback_data: "order_tech" }],
//         ],
//       },
//     });
//   });
// }
