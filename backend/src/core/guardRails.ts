import { KnowledgeBaseEntry } from "../utils/knowledgeBase";
import { MyContext } from "../types";

export function sanitizeHistory(ctx: MyContext, kbAnswer: string | null) {
  // Если найден точный ответ — возвращаем всю историю
  if (kbAnswer) return ctx.session.chatHistory;

  // Иначе фильтруем, оставляя только user и тех. сообщения
  return (
    ctx.session.chatHistory?.filter(
      (msg) => msg.role === "user" || msg.content.startsWith("🔍")
    ) || []
  );
}

export function validateAIResponse(response: string, kbAnswer: string | null) {
  const pricePattern = /(\d+[\s,.]*\d*\s*(тг|тенге|₸|цена|стоим))/i;
  const hallucinationPatterns = [/стоит.*\d+/i, /цена.*составляет/i];

  // TODO: если ответ из базы уже был, блокировать любые новые "галлюцинации" в следующем сообщении

  if (!kbAnswer && pricePattern.test(response)) {
    return "Извините, точную стоимость лучше уточнить у нашего оператора.";
  }

  if (!kbAnswer && hallucinationPatterns.some((p) => p.test(response))) {
    return "Детали услуги лучше уточнить у специалиста. Хотите, я помогу оформить заявку?";
  }

  return response;
}

export function postProcessResponse(response: string): string {
  // Заменяем все видимые цены на "уточняется"
  return response.replace(/\b\d{3,}\s*(тг|тенге|₸)/gi, "[цена уточняется]");
}

export function isPotentialServiceQuestion(text: string): boolean {
  const triggers = ["замена", "ремонт", "установка", "настройка"];
  return triggers.some((t) => text.toLowerCase().includes(t));
}

export function fallbackResponse(prompt: string): string {
  return `Для уточнения стоимости услуги "${prompt}" лучше оставить заявку или уточнить у оператора.`;
}
