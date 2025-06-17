import { useEffect, useRef } from "react";

export function useWebSocket(chatId: string, onMessage: (msg: any) => void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const ws = new WebSocket(`ws://localhost:3000/?chatId=${chatId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`✅ WebSocket connected for chat ${chatId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = () => {
      console.log(`🔌 WebSocket disconnected for chat ${chatId}`);
    };

    return () => {
      ws.close();
    };
  }, [chatId]);
}
