// src/chatStore.ts
import { ChatMessage } from "./types";

type ChatEntry = {
  chatId: number;
  userName: string;
  avatar?: string;
  messages: ChatMessage[];
  updatedAt: Date;
  status: "online" | "offline" | "waiting";
};

export const chatStore = new Map<number, ChatEntry>();

export function saveMessage(
  chatId: number,
  userName: string,
  message: ChatMessage
) {
  const existing = chatStore.get(chatId);

  if (existing) {
    existing.messages.push(message);
    existing.updatedAt = new Date();
    existing.status = "online"; // Обновляем статус при новом сообщении
  } else {
    chatStore.set(chatId, {
      chatId,
      userName,
      messages: [message],
      updatedAt: new Date(),
      status: "online",
    });
  }
}

export function getChat(chatId: number) {
  return chatStore.get(chatId);
}

export function getAllChats() {
  return Array.from(chatStore.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

export function updateChatStatus(
  chatId: number,
  status: "online" | "offline" | "waiting"
) {
  const chat = chatStore.get(chatId);
  if (chat) {
    chat.status = status;
  }
}
