// src/core/sessionLogger.ts

import fs from "fs";
import path from "path";

const sessionLogPath = path.join("logs", "sessions.json");

export function logSessionEvent(
  chatId: string,
  platform: string,
  data: object
) {
  let sessions: any[] = [];

  if (fs.existsSync(sessionLogPath)) {
    const raw = fs.readFileSync(sessionLogPath, "utf-8");
    sessions = JSON.parse(raw);
  }

  sessions.push({
    timestamp: new Date().toISOString(),
    chatId,
    platform,
    ...data,
  });

  fs.writeFileSync(sessionLogPath, JSON.stringify(sessions, null, 2));
}

export {};
