// src/types.ts
import { Context, SessionFlavor } from "grammy";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface SessionData {
  scenario?: "repair" | "cartridge" | "purchase" | "ai_chat";
  step?: string;

  // Для сценария ремонта
  deviceType?: string;
  problem?: string;
  contact?: string;

  // Для сценария заправки картриджей
  model?: string;

  // История сообщений для AI-чата или общего хранения
  chatHistory?: ChatMessage[];
}

export interface RepairRequest {
  id: string;
  type: string;
  problem: string;
  contact: string;
  createdAt: string;
  status: "new" | "in_progress" | "completed";
}
export type MyContext = Context & SessionFlavor<SessionData>;
