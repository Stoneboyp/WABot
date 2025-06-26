import { useEffect, useRef } from "react";
export function useWebSocket(
  chatId: string,
  platform: string,
  onMessage: (msg: any) => void
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const isGlobal = chatId === "*" && platform === "*";
    const url = isGlobal
      ? `ws://localhost:3000/`
      : `ws://localhost:3000/?chatId=${chatId}&platform=${platform}`;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`✅ WebSocket connected for ${platform}:${chatId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("💬 [WS] incoming:", data);

        onMessage(data);
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = () => {
      console.log(`🔌 WebSocket disconnected for ${platform}:${chatId}`);
    };

    return () => {
      ws.close();
    };
  }, [chatId, platform]);
}
