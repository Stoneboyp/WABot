// utils/formatMessage.ts
import { ChatMessage } from "../types";

export function formatMessage(message: ChatMessage, index: number) {
  return {
    id: index,
    text: message.content,
    sender: message.role === "assistant" ? "operator" : "user",
    timestamp: message.timestamp,
  };
}
