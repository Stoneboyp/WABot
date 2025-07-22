// utils/scenarioConfigs.ts

import { SessionData } from "../types";

type Scenario = SessionData["scenario"];

type ScenarioConfig = {
  required: (keyof SessionData)[];
  buildConfirmation: (session: SessionData) => string;
  buildFinalConfirmation?: (session: SessionData) => string;
  keywords: string[];
};

export const scenarioConfigs: Record<
  "repair" | "cartridge" | "purchase",
  ScenarioConfig
> = {
  cartridge: {
    keywords: ["заправка", "картридж", "тонер"],
    required: ["model", "count", "address"],
    buildConfirmation: (session) =>
      `📝 Подтвердите заявку: заправка ${session.count} картриджей ${session.model} по адресу ${session.address}. Всё верно?`,
    buildFinalConfirmation: (session) =>
      `✅ Заявка оформлена. Мы свяжемся с вами по адресу ${session.address} для заправки ${session.count} картриджей ${session.model}.`,
  },
  repair: {
    keywords: [
      "ремонт",
      "не работает",
      "сломался",
      "не включается",
      "чинить",
      "не печатает",
    ],
    required: ["deviceType", "problem", "address"],
    buildConfirmation: (session) =>
      `🛠️ Подтвердите заявку: ремонт ${session.deviceType}, проблема: "${session.problem}", адрес: ${session.address}. Всё верно?`,
    buildFinalConfirmation: (session) =>
      `✅ Заявка на ремонт ${session.deviceType} оформлена. Мы приедем по адресу ${session.address} для устранения: "${session.problem}".`,
  },
  purchase: {
    keywords: ["купить", "заказать", "продажа", "доставка", "нужен", "хочу"],
    required: ["product", "model", "address"],
    buildConfirmation: (session) =>
      `🛒 Подтвердите заявку: покупка ${session.product} (${session.model}) по адресу ${session.address}. Всё верно?`,
    buildFinalConfirmation: (session) =>
      `✅ Заявка на покупку ${session.product} (${session.model}) оформлена. Мы свяжемся с вами по адресу ${session.address}.`,
  },
};
