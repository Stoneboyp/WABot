// src/types.ts

export interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}
export type Chat = {
  chatId: string;
  platform: string;
  userName: string;
  avatar?: string;
  updatedAt: string;
  lastMessage?: string;
  notification?: boolean;
  messages?: {
    id: number;
    text: string;
    sender: string;
    timestamp: string;
  }[];
};
