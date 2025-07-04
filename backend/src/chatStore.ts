// src/chatStore.ts
import { ChatEntry, ChatMessage, ChatPlatform } from "./types";
import { broadcastAll } from "./ws/socket-server";

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
    existing.lastMessage = message.content;
  } else {
    const newChat: ChatEntry = {
      platform,
      chatId,
      userName,
      messages: [message],
      updatedAt: new Date(),
      status: "online",
      mode: "ai",
      notification: false,
      lastMessage: message.content,
      session: {},
    };

    chatStore.set(key, newChat);

    broadcastAll({
      type: "new_chat",
      payload: newChat,
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

export function setChatMode(
  platform: ChatPlatform,
  chatId: string,
  mode: "operator" | "ai"
) {
  const chat = chatStore.get(makeKey(platform, chatId));
  if (chat) {
    chat.mode = mode;
  }
}

export { chatStore, ChatPlatform };
