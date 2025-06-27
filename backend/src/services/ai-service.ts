import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import Groq from "groq-sdk";
import { MyContext } from "../types";
import { ChatCompletionMessageParam as OpenAIMessage } from "openai/resources/chat";
import { ChatCompletionMessageParam as GroqMessage } from "groq-sdk/resources/chat/completions";
import { loadKnowledgeBase, findAnswerInKB } from "../utils/knowledgeBase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function getAIResponse(
  ctx: MyContext,
  prompt: string,
  context = ""
): Promise<string> {
  ctx.session.chatHistory ||= [];

  // Сначала всегда проверяем базу знаний
  let kbAnswer: string | null = null;
  try {
    const kb = await loadKnowledgeBase();
    kbAnswer = findAnswerInKB(kb, prompt);

    // Если нашли точный ответ в базе - возвращаем его
    if (kbAnswer) {
      ctx.session.chatHistory.push(
        { role: "user", content: prompt, timestamp: new Date() },
        { role: "assistant", content: kbAnswer, timestamp: new Date() }
      );
      ctx.session.chatHistory = ctx.session.chatHistory.slice(-10);
      console.log("📚 Ответ из базы знаний:", kbAnswer);
      return kbAnswer;
    }
  } catch (err) {
    console.warn(
      "⚠️ Не удалось загрузить базу знаний:",
      (err as Error).message
    );
  }

  // Только если в базе нет ответа - применяем фильтры
  const pricingKeywords = [
    "цена",
    "стоимость",
    "сколько стоит",
    "по чем",
    "расценка",
    "прайс",
    "сколько будет",
  ];

  const isPriceRelated = pricingKeywords.some((kw) =>
    prompt.toLowerCase().includes(kw)
  );

  if (isPriceRelated) {
    return "Извините, я не могу точно ответить на вопрос о стоимости. Лучше уточнить у нашего оператора.";
  }

  const systemPrompt = `
Ты — опытный AI-консультант компании Integra Business, специализирующейся на ремонте оргтехники, ноутбуков, а также заправке и восстановлении картриджей.

Твоя задача — вежливо и эффективно помогать клиенту:
- подобрать нужную услугу,
- уточнить стоимость (если она есть в базе знаний),
- объяснить, как проходит выезд, оплата, диагностика,
- подсказать, как оставить заявку или получить помощь.

Правила:
1. Сначала ищи ответ в базе знаний (таблица), не выдумывай ничего от себя.
2. Если ответа нет — используй общие знания и аккуратно предположи, что может подойти.
3. Не придумывай цену, адрес или условия, или услуги если их нет в базе.
4. Если вопрос не по твоей теме — деликатно откажи.
5. Общайся по-человечески, но профессионально. Клиенты — не технические специалисты, объясняй просто и понятно.
`;

  const openaiMessages: OpenAIMessage[] = [
    { role: "system", content: systemPrompt + "\n" + context },
    ...ctx.session.chatHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: prompt },
  ];

  const groqMessages: GroqMessage[] = [
    { role: "system", content: systemPrompt + "\n" + context },
    ...ctx.session.chatHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: prompt },
  ];

  async function tryOpenAICompletion(client: OpenAI, model: string) {
    const res = await client.chat.completions.create({
      model,
      messages: openaiMessages,
      temperature: 0.7,
    });
    if (res.choices.length === 0) throw new Error("No response from AI");
    return res.choices[0].message?.content ?? "Не удалось получить ответ";
  }

  async function tryGroqCompletion() {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
    });
    if (!res.choices || res.choices.length === 0)
      throw new Error("No response from Groq AI");
    return (
      res.choices[0].message?.content || "Не удалось получить ответ от Groq"
    );
  }

  try {
    const response = await tryOpenAICompletion(openai, "gpt-3.5-turbo");

    ctx.session.chatHistory.push(
      { role: "user", content: prompt, timestamp: new Date() },
      { role: "assistant", content: response, timestamp: new Date() }
    );
    ctx.session.chatHistory = ctx.session.chatHistory.slice(-10);

    return response;
  } catch (errOpenAI) {
    console.log(
      "OpenAI error, fallback to DeepSeek:",
      (errOpenAI as Error).message
    );

    try {
      const response = await tryOpenAICompletion(deepseek, "deepseek-chat");

      ctx.session.chatHistory.push(
        { role: "user", content: prompt, timestamp: new Date() },
        { role: "assistant", content: response, timestamp: new Date() }
      );
      ctx.session.chatHistory = ctx.session.chatHistory.slice(-10);

      return response;
    } catch (errDeepSeek) {
      console.log(
        "DeepSeek error, fallback to Groq:",
        (errDeepSeek as Error).message
      );

      try {
        const response = await tryGroqCompletion();

        ctx.session.chatHistory.push(
          { role: "user", content: prompt, timestamp: new Date() },
          { role: "assistant", content: response, timestamp: new Date() }
        );
        ctx.session.chatHistory = ctx.session.chatHistory.slice(-10);

        return response;
      } catch (errGroq) {
        console.error("Groq error:", (errGroq as Error).message);
        throw new Error("Все AI-сервисы временно недоступны.");
      }
    }
  }
}
