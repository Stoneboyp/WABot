import { useEffect, useRef } from "react";
import { Box, Typography, Paper, Button, Stack } from "@mui/material";
import { MessageInput } from "@components/MessageInput/MessageInput";
import {
  fetchMessages,
  sendMessage,
  sendOperatorReply,
  updateChatMode,
} from "../../../services/api";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useChatContext } from "@/context/ChatContext";

export const ChatWindow = ({
  chat,
}: {
  chat: {
    chatId: string;
    platform: string;
    userName: string;
  };
}) => {
  const {
    isOperatorMode,
    setIsOperatorMode,
    messages,
    setMessages,
    chats,
    setChats,
  } = useChatContext();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ⬇️ Загрузка сообщений при смене чата
  useEffect(() => {
    const loadMessages = async () => {
      const data = await fetchMessages(chat.chatId, chat.platform);
      setMessages(data);
    };
    loadMessages();
  }, [chat.chatId, chat.platform]);

  // ⬇️ Скролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ⬇️ Отправка сообщений
  const handleSend = async (text: string) => {
    const now = new Date().toISOString();

    try {
      if (isOperatorMode) {
        await sendOperatorReply(chat.chatId, text, chat.platform);
      } else {
        const response = await sendMessage(
          chat.chatId,
          text,
          chat.platform,
          "ai"
        );
        const userMsg = {
          id: Date.now(),
          text,
          sender: "user",
          timestamp: now,
        };
        const botMsg = {
          id: Date.now() + 1,
          text: response.reply,
          sender: "bot",
          timestamp: now,
        };
        setMessages((prev) => [...prev, userMsg, botMsg]);
        syncChatMessages(botMsg);
      }
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  // ⬇️ WebSocket подписка
  useWebSocket(chat.chatId, chat.platform, (data) => {
    if (data.type === "new_message") {
      const msg = data.payload;
      const newMsg = {
        id: Date.now(),
        text: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp,
      };

      // Добавляем сообщение в messages, если чат активен
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (m) =>
            m.timestamp === msg.timestamp &&
            m.text === msg.content &&
            m.sender === msg.sender
        );
        if (alreadyExists) return prev;
        return [...prev, newMsg];
      });

      syncChatMessages(newMsg);
    }
  });

  // 🔄 Синхронизировать сообщения с chats
  const syncChatMessages = (lastMsg: {
    text: string;
    timestamp: string;
    sender: string;
    id: number;
  }) => {
    setChats((prev) =>
      prev.map((c) =>
        c.chatId === chat.chatId && c.platform === chat.platform
          ? {
              ...c,
              lastMessage: lastMsg.text,
              updatedAt: lastMsg.timestamp,
              notification: false,
              // При желании можно хранить messages в chat
              // messages: [...(c.messages || []), lastMsg],
            }
          : c
      )
    );
  };
  console.log(chats, messages);

  return (
    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" justifyContent="space-between" p={2}>
        <Typography variant="h6">
          Чат с {chat.userName} ({chat.platform})
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={async () => {
            const newMode = isOperatorMode ? "ai" : "operator";
            setIsOperatorMode(!isOperatorMode);
            try {
              await updateChatMode(chat.chatId, chat.platform, newMode);
              console.log(`[MODE] switched to ${newMode}`);
            } catch (error) {
              console.error("Ошибка при обновлении режима:", error);
            }
          }}
        >
          {isOperatorMode ? "Оператор" : "AI"}
        </Button>
      </Stack>

      <Box
        flexGrow={1}
        p={2}
        sx={{ overflowY: "auto", backgroundColor: "#f0f0f0" }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            mb={1}
            display="flex"
            justifyContent={
              msg.sender === "operator" || msg.sender === "bot"
                ? "flex-end"
                : "flex-start"
            }
          >
            <Box
              px={2}
              py={1}
              borderRadius={2}
              maxWidth="75%"
              sx={{
                backgroundColor:
                  msg.sender === "operator" || msg.sender === "bot"
                    ? "#dcf8c6"
                    : "#fff",
              }}
            >
              <Typography variant="body2">{msg.text}</Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", textAlign: "right" }}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {isOperatorMode ? <MessageInput onSend={handleSend} /> : null}
    </Paper>
  );
};
