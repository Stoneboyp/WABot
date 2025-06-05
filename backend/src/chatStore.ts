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

// Генерация тестовых данных
function initializeMockData() {
  const mockChats: ChatEntry[] = [
    {
      chatId: 123456789,
      userName: "Иван Петров",
      avatar: "https://i.pravatar.cc/150?img=1",
      status: "online",
      updatedAt: new Date(),
      messages: [
        {
          role: "user",
          content: "Здравствуйте, у меня проблема с принтером",
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          role: "assistant",
          content: "Опишите подробнее вашу проблему",
          timestamp: new Date(Date.now() - 1800000),
        },
      ],
    },
    {
      chatId: 987654321,
      userName: "Анна Сидорова",
      avatar: "https://i.pravatar.cc/150?img=3",
      status: "waiting",
      updatedAt: new Date(Date.now() - 86400000),
      messages: [
        {
          role: "user",
          content: "Нужна заправка картриджа для HP LJ 1020",
          timestamp: new Date(Date.now() - 86400000),
        },
      ],
    },
  ];

  mockChats.forEach((chat) => {
    chatStore.set(chat.chatId, chat);
  });
}

// Инициализация при первом импорте
initializeMockData();

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

// Дополнительные методы для работы с хранилищем
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
