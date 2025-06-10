import { ChatMessage } from "../types";

export function formatMessage(msg: ChatMessage, index: number) {
  return {
    id: index,
    text: msg.content,
    sender: msg.role === "assistant" ? "operator" : msg.role,
    timestamp: msg.timestamp.toISOString(),
  };
}
