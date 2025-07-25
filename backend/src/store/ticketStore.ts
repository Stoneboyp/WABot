// store/ticketStore.ts
import { AIMessage, SessionData } from "../types";

export type Ticket = {
  id: string;
  chatId: string;
  platform: string;
  scenario: SessionData["scenario"];
  data: Partial<SessionData>;
  aiData: AIMessage["data"];
  createdAt: Date;
  confirmed: boolean;
};

const tickets: Ticket[] = [];

export function addTicket(
  chatId: string,
  platform: string,
  session: SessionData,
  aiMessage: AIMessage
) {
  const ticket: Ticket = {
    id: Date.now().toString(),
    chatId,
    platform,
    scenario: session.scenario!,
    aiData: aiMessage.data,
    data: { ...session },
    createdAt: new Date(),
    confirmed: !!session.confirmed,
  };

  tickets.push(ticket);

  // Запись в файл
  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.resolve(__dirname, "../../logs/tickets.json");

    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : [];

    existing.push(ticket);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  } catch (err) {
    console.error("[TicketStore] Ошибка при записи в файл:", err);
  }

  return ticket;
}

export function getTickets() {
  return tickets;
}
