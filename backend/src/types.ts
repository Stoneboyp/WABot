// src/types.ts
import { Context, SessionFlavor } from "grammy";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SessionData {
  scenario?: "repair" | "cartridge" | "purchase";
  step?: "collecting" | "awaiting_confirmation" | "done";
  confirmed?: boolean;

  // Для заправки картриджей
  model?: string;
  count?: number;
  address?: string;

  // Для ремонта
  deviceType?: string;
  problem?: string;

  // Для покупки
  product?: string;

  chatHistory?: ChatMessage[];
}

export interface MyContext {
  chatId: string;
  platform: ChatPlatform;
  userName: string;
  session: SessionData;
}
export type ChatPlatform = "whatsapp" | "telegram" | "other";

export interface ChatEntry {
  platform: ChatPlatform;
  chatId: string;
  userName: string;
  session: SessionData;
  avatar?: string;
  messages: ChatMessage[];
  updatedAt: Date;
  mode?: "operator" | "ai";
  status: "online" | "offline" | "waiting";
  notification?: boolean;
  lastMessage?: string;
}

export interface RepairRequest {
  id: string;
  type: string;
  problem: string;
  contact: string;
  createdAt: string;
  status: "new" | "in_progress" | "completed";
}
