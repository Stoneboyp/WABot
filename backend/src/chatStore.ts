// src/chatStore.ts
export { };
import { ChatMessage } from './types';

type ChatEntry = {
  chatId: number;
  userName: string;
  messages: ChatMessage[];
  updatedAt: Date;
};

export const chatStore = new Map<number, ChatEntry>();

export function saveMessage(chatId: number, userName: string, message: ChatMessage) {
  const existing = chatStore.get(chatId);

  if (existing) {
    existing.messages.push(message);
    existing.updatedAt = new Date();
  } else {
    chatStore.set(chatId, {
      chatId,
      userName,
      messages: [message],
      updatedAt: new Date()
    });
  }
}
