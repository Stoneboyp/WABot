// src/types.ts

export interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}
export type Chat = {
  chatId: string;
  platform: "telegram" | "whatsapp" | "other";
  userName: string;
  avatar?: string;
  updatedAt: string;
  status: "online" | "offline" | "waiting";
  notification: boolean;
  lastMessage?: string;
};
