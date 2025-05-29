// src/types.ts
import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  scenario?: "repair" | "cartridge" | "purchase";
  step?: string;
  deviceType?: string;
  problem?: string;
  contact?: string;
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
