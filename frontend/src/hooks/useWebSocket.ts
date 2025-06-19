import { useEffect, useRef } from "react";
export function useWebSocket(
  chatId: string,
  platform: string,
  onMessage: (msg: any) => void
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!chatId || !platform) return;

    const ws = new WebSocket(
      `ws://localhost:3000/?chatId=${chatId}&platform=${platform}`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`✅ WebSocket connected for ${platform}:${chatId}`);
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
      console.log(`🔌 WebSocket disconnected for ${platform}:${chatId}`);
    };

    return () => {
      ws.close();
    };
  }, [chatId, platform]);
}
