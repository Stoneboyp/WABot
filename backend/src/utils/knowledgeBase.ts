import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";

dotenv.config();

export type KnowledgeBaseEntry = {
  question: string;
  answer: string;
};
console.log("Загружаю базу знаний с:", process.env.KB_CSV_URL);
/**
 * Загружает и парсит базу знаний из Google Таблицы (CSV формат)
 */
export async function loadKnowledgeBase(): Promise<KnowledgeBaseEntry[]> {
  const KNOWLEDGE_BASE_URL = process.env.KB_CSV_URL!;
  const res = await fetch(KNOWLEDGE_BASE_URL);
  const csv = await res.text();

  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
  }) as KnowledgeBaseEntry[];

  return records;
}

/**
 * Ищет точное совпадение вопроса (без регистра)
 */
export function findAnswerInKB(
  kb: KnowledgeBaseEntry[],
  userInput: string
): string | null {
  const lowerInput = userInput.toLowerCase();
  const found = kb.find((entry) =>
    lowerInput.includes(entry.question.toLowerCase())
  );
  return found?.answer || null;
}
