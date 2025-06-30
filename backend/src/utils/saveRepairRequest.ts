//temp before multiplatform context
// import { MyContext } from "../types";
// import { notifyManager } from "../services/notification";

// export async function saveRepairRequest(ctx: MyContext) {
//   if (!ctx.message?.text) throw new Error("Нет текста в сообщении");

//   const request = {
//     id: Date.now().toString(),
//     type: ctx.session.deviceType || "не указано",
//     problem: ctx.session.problem || "не указано",
//     contact: ctx.message.text,
//     createdAt: new Date().toISOString(),
//     status: "new" as const,
//   };

//   await notifyManager(request);
// }
