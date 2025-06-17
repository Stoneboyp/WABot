import { useEffect, useState, useRef } from "react";
import { Box, Typography, Paper, Button, Stack } from "@mui/material";
import { MessageInput } from "@components/MessageInput/MessageInput";
import {
  fetchMessages,
  sendMessage,
  sendOperatorReply,
} from "../../../services/api";
import type { Chat } from "../../context/ChatContext";

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}
type ChatWindowProps = {
  chat: Chat;
};

export const ChatWindow = ({ chat }: ChatWindowProps) => {
  const { chatId, platform, userName } = chat;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isOperatorMode, setIsOperatorMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const data = await fetchMessages(chatId, platform);
      setMessages(data);
    };
    loadMessages();
  }, [chatId, platform]);

  const handleSend = async (text: string) => {
    try {
      if (isOperatorMode) {
        await sendOperatorReply(chatId, text, platform);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text,
            sender: "operator",
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        const response = await sendMessage(chatId, text, platform);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text,
            sender: "user",
            timestamp: new Date().toISOString(),
          },
          {
            id: Date.now() + 1,
            text: response.reply,
            sender: "bot",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{ height: "75vh", display: "flex", flexDirection: "column" }}
    >
      <Stack direction="row" justifyContent="space-between" p={2}>
        <Typography variant="h6">Чат с {userName}</Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setIsOperatorMode((prev) => !prev)}
        >
          {isOperatorMode ? "Режим: Оператор" : "Режим: AI"}
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
              msg.sender === "operator" ? "flex-end" : "flex-start"
            }
          >
            <Box
              px={2}
              py={1}
              borderRadius={2}
              maxWidth="75%"
              sx={{
                backgroundColor: msg.sender === "operator" ? "#dcf8c6" : "#fff",
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
