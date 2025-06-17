import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import Groq from "groq-sdk";
import { MyContext } from "../types";
import { ChatCompletionMessageParam as OpenAIMessage } from "openai/resources/chat";
import { ChatCompletionMessageParam as GroqMessage } from "groq-sdk/resources/chat/completions";

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

  const systemPrompt = `Ты — AI-помощник в чате техподдержки. Общайся вежливо, задавай уточняющие вопросы при необходимости.`;

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
