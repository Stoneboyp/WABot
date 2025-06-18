import { useEffect, useState, useRef } from "react";
import { Box, Typography, Paper, Button, Stack } from "@mui/material";
import { MessageInput } from "@components/MessageInput/MessageInput";
import {
  fetchMessages,
  sendMessage,
  sendOperatorReply,
  updateChatMode,
} from "../../../services/api";
import { useWebSocket } from "../../hooks/useWebSocket";

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

export const ChatWindow = ({
  chat,
}: {
  chat: {
    chatId: string;
    platform: string;
    userName: string;
  };
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOperatorMode, setIsOperatorMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const data = await fetchMessages(chat.chatId, chat.platform);
      setMessages(data);
    };
    loadMessages();
  }, [chat.chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSend = async (text: string) => {
    console.log(`[SEND] Mode: ${isOperatorMode ? "operator" : "AI"}`);
    try {
      const now = new Date().toISOString();

      if (isOperatorMode) {
        await sendOperatorReply(chat.chatId, text, chat.platform);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text,
            sender: "operator",
            timestamp: now,
          },
        ]);
      } else {
        const mode = isOperatorMode ? "operator" : "ai";
        const response = await sendMessage(
          chat.chatId,
          text,
          chat.platform,
          mode
        );
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text,
            sender: "user",
            timestamp: now,
          },
          {
            id: Date.now() + 1,
            text: response.reply,
            sender: "bot",
            timestamp: now,
          },
        ]);
      }
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  useWebSocket(chat.chatId, (data) => {
    if (data.type === "new_message") {
      const msg = data.payload;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
        },
      ]);
    }
  });

  return (
    <Paper
      elevation={3}
      sx={{ height: "75vh", display: "flex", flexDirection: "column" }}
    >
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

      <MessageInput onSend={handleSend} />
    </Paper>
  );
};
