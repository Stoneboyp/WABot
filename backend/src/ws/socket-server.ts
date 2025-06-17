import { WebSocketServer } from "ws";
import http from "http";

const clients = new Map<string, WebSocket>(); // chatId -> socket

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      ws.close();
      return;
    }

    clients.set(chatId, ws);
    console.log(`🔌 Client connected: ${chatId}`);

    ws.on("close", () => {
      clients.delete(chatId);
      console.log(`❌ Client disconnected: ${chatId}`);
    });
  });
}

export function broadcastTo(chatId: string, message: any) {
  const socket = clients.get(chatId);
  if (socket && socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}
