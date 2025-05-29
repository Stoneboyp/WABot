// utils/session.ts
import { MyContext } from "../types";

export function resetSession(ctx: MyContext) {
  ctx.session = {};
}
