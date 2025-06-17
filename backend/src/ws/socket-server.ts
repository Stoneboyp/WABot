// socket-server.ts
import { WebSocket, WebSocketServer } from "ws";
import http from "http";

const clients = new Map<string, WebSocket>();

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      ws.close();
      console.log("❌ WebSocket connection rejected: no chatId");
      return;
    }

    clients.set(chatId, ws);
    console.log(`✅ WS connected: chatId=${chatId} | total: ${clients.size}`);

    ws.on("close", () => {
      clients.delete(chatId);
      console.log(
        `🔌 WS disconnected: chatId=${chatId} | total: ${clients.size}`
      );
    });
  });
}

export function broadcastTo(chatId: string, message: any) {
  const socket = clients.get(chatId);
  const json = JSON.stringify(message);

  if (socket && socket.readyState === socket.OPEN) {
    socket.send(json);
    console.log(`📤 Sent to [${chatId}]:`, message);
  } else {
    console.log(`⚠️ No active WS for chatId=${chatId}, message dropped`);
  }
}
