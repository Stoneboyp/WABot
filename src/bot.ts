import { Bot, session } from "grammy";
import dotenv from "dotenv";
import { MyContext, SessionData } from "./types";

import { setupGreeting } from "./scenarios/greeting";
import { setupRepairScenario, handleRepairSteps } from "./scenarios/repair";
import {
  setupCartridgeScenario,
  handleCartridgeStep,
} from "./scenarios/cartridje";

dotenv.config();

const token = process.env.TG_TOKEN;
if (!token) throw new Error("TG_TOKEN is not defined");

export const bot = new Bot<MyContext>(token);

bot.use(
  session({
    initial: (): SessionData => ({
      scenario: undefined,
      step: undefined,
      deviceType: undefined,
      problem: undefined,
    }),
  })
);

// Подключение сценариев
setupGreeting(bot);
setupRepairScenario(bot);
setupCartridgeScenario(bot);

// Централизованный обработчик текстов
bot.on("message:text", async (ctx) => {
  switch (ctx.session.scenario) {
    case "repair":
      await handleRepairSteps(ctx);
      break;
    case "cartridge":
      await handleCartridgeStep(ctx);
      break;
  }
});

bot.start();
