// services/knowledge-base.ts
import { loadKnowledgeBase, findAnswerInKB } from "../utils/knowledgeBase";

let cachedKB: Awaited<ReturnType<typeof loadKnowledgeBase>> | null = null;

export async function searchKnowledgeBase(
  userInput: string
): Promise<string | null> {
  if (!cachedKB) {
    try {
      cachedKB = await loadKnowledgeBase();
    } catch (err) {
      console.error("Ошибка загрузки базы знаний:", err);
      return null;
    }
  }

  return findAnswerInKB(cachedKB, userInput);
}
