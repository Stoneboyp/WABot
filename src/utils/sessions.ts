import { MyContext } from "../types";

export function resetSession(ctx: MyContext) {
  ctx.session = {
    chatHistory: ctx.session.chatHistory || [],
  };
}
