import { ChatMessage } from "./types";

export type ChatPlatform = "whatsapp" | "telegram" | "other";

export interface ChatEntry {
  platform: ChatPlatform;
  chatId: string;
  userName: string;
  avatar?: string;
  messages: ChatMessage[];
  updatedAt: Date;
  status: "online" | "offline" | "waiting";
}

// 🧠 Используем составной ключ
function makeKey(platform: ChatPlatform, chatId: string) {
  return `${platform}:${chatId}`;
}

const chatStore = new Map<string, ChatEntry>();

export function saveMessage(
  platform: ChatPlatform,
  chatId: string,
  userName: string,
  message: ChatMessage
) {
  const key = makeKey(platform, chatId);
  const existing = chatStore.get(key);

  if (existing) {
    existing.messages.push(message);
    existing.updatedAt = new Date();
    existing.status = "online";
  } else {
    chatStore.set(key, {
      platform,
      chatId,
      userName,
      messages: [message],
      updatedAt: new Date(),
      status: "online",
    });
  }
}

export function getChat(
  platform: ChatPlatform,
  chatId: string
): ChatEntry | undefined {
  return chatStore.get(makeKey(platform, chatId));
}

export function getAllChats(): ChatEntry[] {
  return Array.from(chatStore.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );
}

export function updateChatStatus(
  platform: ChatPlatform,
  chatId: string,
  status: "online" | "offline" | "waiting"
) {
  const chat = chatStore.get(makeKey(platform, chatId));
  if (chat) {
    chat.status = status;
  }
}

export { chatStore };
