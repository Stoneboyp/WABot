// src/ws/socket-server.ts
import { WebSocket, WebSocketServer } from "ws";
import http from "http";

const clients = new Map<string, WebSocket>();

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      ws.close();
      return;
    }

    if (clients.has(chatId)) {
      console.log(
        `⚠️ Client ${chatId} already connected. Closing previous socket`
      );
      const prev = clients.get(chatId);
      prev?.close();
    }

    clients.set(chatId, ws);
    console.log(`🔌 WebSocket client connected: ${chatId}`);

    ws.on("close", () => {
      clients.delete(chatId);
      console.log(`❌ WebSocket client disconnected: ${chatId}`);
    });
  });
}

export function broadcastTo(chatId: string, message: any) {
  const socket = clients.get(chatId);
  if (socket && socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function broadcastAll(message: any) {
  for (const [chatId, socket] of clients.entries()) {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}
console.log("🔥 WebSocket server initialized");
