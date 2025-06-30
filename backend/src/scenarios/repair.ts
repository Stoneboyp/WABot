// // scenarios/repair.ts
// import { Bot } from "grammy";
// import { MyContext } from "../types";
// import { saveRepairRequest } from "../utils/saveRepairRequest";
// import { resetSession } from "../utils/sessions";

// export function setupRepairScenario(bot: Bot<MyContext>) {
//   bot.hears("🛠️ Ремонт техники", async (ctx) => {
//     ctx.session.scenario = "repair";
//     ctx.session.step = "type";

//     await ctx.reply("Какая техника требует ремонта?", {
//       reply_markup: {
//         keyboard: [["Принтер/МФУ"], ["Компьютер"], ["Сервер"], ["Другое"]],
//         resize_keyboard: true,
//       },
//     });
//   });
// }

// export async function handleRepairSteps(ctx: MyContext) {
//   const text = ctx.message?.text?.toLowerCase() || "";

//   if (["отмена", "не хочу", "нет", "стоп"].includes(text)) {
//     await ctx.reply("Заявка отменена. Если понадобится помощь — напишите.");
//     return resetSession(ctx);
//   }

//   switch (ctx.session.step) {
//     case "type":
//       ctx.session.deviceType = ctx.message?.text || "";
//       ctx.session.step = "problem";
//       await ctx.reply("Опишите проблему:");
//       break;

//     case "problem":
//       ctx.session.problem = ctx.message?.text || "";
//       ctx.session.step = "contact";
//       await ctx.reply("Оставьте контакт для связи:", {
//         reply_markup: { remove_keyboard: true },
//       });
//       break;

//     case "contact":
//       ctx.session.contact = ctx.message?.text || "";

//       // Подтверждение заявки
//       await ctx.reply(
//         `Проверьте данные заявки:\nТип: ${ctx.session.deviceType}\nПроблема: ${ctx.session.problem}\nКонтакт: ${ctx.session.contact}\n\nПодтвердите отправку заявки (да/нет)`
//       );
//       ctx.session.step = "confirm";
//       break;

//     case "confirm":
//       if (text === "да") {
//         await saveRepairRequest(ctx);
//         await ctx.reply(
//           "✅ Заявка принята! Мастер свяжется в течение 30 минут."
//         );
//       } else {
//         await ctx.reply("Заявка отменена. Если понадобится помощь — напишите.");
//       }
//       resetSession(ctx);
//       break;
//   }
// }
