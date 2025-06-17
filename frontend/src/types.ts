// src/types.ts

export type Chat = {
  chatId: string;
  platform: "telegram" | "whatsapp" | "other";
  userName: string;
  avatar?: string;
  updatedAt: string;
  status: "online" | "offline" | "waiting";
};
