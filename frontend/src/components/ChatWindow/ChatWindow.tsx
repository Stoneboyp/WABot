import { useEffect, useState, useRef } from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import { MessageInput } from "@components/MessageInput/MessageInput";
import { fetchMessages, sendMessage } from "../../../services/api";

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

export const ChatWindow = ({ chatId }: { chatId: number }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const data = await fetchMessages(chatId);
      setMessages(data);
    };
    loadMessages();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    await sendMessage(chatId, text);
    setMessages([
      ...messages,
      {
        id: Date.now(),
        text,
        sender: "operator",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <Paper
      elevation={3}
      sx={{ height: "75vh", display: "flex", flexDirection: "column" }}
    >
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
