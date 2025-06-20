import { useEffect, useState } from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  Badge,
} from "@mui/material";
import { fetchChats } from "../../../services/api";
import type { Chat } from "../../types";
import { useChatContext } from "@/context/ChatContext";

type ChatListProps = {
  onSelect: (chat: Chat) => void;
};

export const ChatList = ({ onSelect }: ChatListProps) => {
  const { chats, setChats } = useChatContext();
  const PORT = import.meta.env.PORT || 3000;
  console.log("💬 chats:", chats);
  useEffect(() => {
    const loadChats = async () => {
      const data = await fetchChats();
      setChats(data);
    };
    loadChats();
  }, []);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:${PORT}/?chatId=admin&platform=admin`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "new_chat") {
        const newChat = data.payload as Chat;

        setChats((prev) => {
          const exists = prev.some(
            (chat) =>
              chat.chatId === newChat.chatId &&
              chat.platform === newChat.platform
          );

          if (exists) {
            return prev.map((chat) =>
              chat.chatId === newChat.chatId &&
              chat.platform === newChat.platform
                ? { ...chat, ...newChat }
                : chat
            );
          } else {
            return [...prev, newChat];
          }
        });
      }

      if (data.type === "new_message") {
        const { chatId, platform } = data.payload;

        setChats((prev) =>
          prev.map((chat) =>
            chat.chatId === chatId && chat.platform === platform
              ? {
                  ...chat,
                  updatedAt: new Date().toISOString(),
                  notification: true,
                }
              : chat
          )
        );
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Список чатов
      </Typography>
      <List>
        {chats.map((chat) => (
          <ListItem
            key={`${chat.platform}:${chat.chatId}`}
            component="button"
            onClick={() => onSelect(chat)}
          >
            <ListItemAvatar>
              <Badge color="error" variant="dot" invisible={!chat.notification}>
                <Avatar src={chat.avatar} />
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={chat.userName}
              secondary={new Date(chat.updatedAt).toLocaleTimeString()}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
