// src/ws/socket-server.ts
import { WebSocket, WebSocketServer } from "ws";
import http from "http";

const clients = new Map<string, WebSocket>();

function getClientKey(chatId: string, platform: string) {
  return `${platform}:${chatId}`;
}

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const chatId = url.searchParams.get("chatId");
    const platform = url.searchParams.get("platform");

    if (!chatId || !platform) {
      ws.close();
      return;
    }

    const key = getClientKey(chatId, platform);

    if (clients.has(key)) {
      console.log(
        `⚠️ Client ${key} already connected. Closing previous socket`
      );
      clients.get(key)?.close();
    }

    clients.set(key, ws);
    console.log(`🔌 WebSocket client connected: ${key}`);
    ws.send(
      JSON.stringify({ type: "welcome", message: "WebSocket connected" })
    );

    ws.on("close", () => {
      clients.delete(key);
      console.log(`❌ WebSocket client disconnected: ${key}`);
    });
  });
}

export function broadcastTo(chatId: string, platform: string, message: any) {
  const key = getClientKey(chatId, platform);
  const socket = clients.get(key);
  if (socket && socket.readyState === WebSocket.OPEN) {
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

//webhook platforms
export function handleWebhookFromPlatform(platform: string, body: any) {
  if (platform === "telegram") {
    const message = body.message;
    if (!message || !message.text) return;

    const chatId = String(message.chat.id);
    const userName = message.from?.first_name || "Telegram User";
    const text = message.text;

    broadcastTo(chatId, "telegram", {
      type: "new_message",
      payload: {
        chatId,
        platform: "telegram",
        sender: userName,
        content: text,
        timestamp: new Date().toISOString(),
        notification: true,
        lastMessage: text,
      },
    });
  }
  // temp use pooling http
  // if (platform === "whatsapp") {
  //   const type = body.typeWebhook;

  //   if (type === "incomingMessageReceived") {
  //     const msg = body.messageData;
  //     const chatId = msg.senderData.chatId;
  //     const userName = msg.senderData.senderName;
  //     const text = msg.message.textMessageData?.textMessage;

  //     if (!text) return;

  //     broadcastTo(chatId, "whatsapp", {
  //       type: "new_message",
  //       payload: {
  //         chatId,
  //         platform: "whatsapp",
  //         sender: userName,
  //         content: text,
  //         timestamp: new Date().toISOString(),
  //       },
  //     });
  //   }

  //   if (type === "statusInstanceChanged") {
  //     broadcastAll({
  //       type: "wa_status",
  //       payload: {
  //         status: body.statusInstance,
  //       },
  //     });
  //   }
  // }
}
