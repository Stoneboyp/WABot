import { useEffect } from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
  Badge,
  Divider,
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

  useEffect(() => {
    const loadChats = async () => {
      const data = await fetchChats();
      setChats(data);
    };
    loadChats();
  }, [setChats]);

  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:${PORT}/?chatId=admin&platform=admin`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat_updated" || data.type === "new_message") {
        setChats((prev) =>
          prev.map((chat) =>
            chat.chatId === data.payload.chatId &&
            chat.platform === data.payload.platform
              ? { ...chat, ...data.payload }
              : chat
          )
        );
      }

      if (data.type === "new_chat") {
        const newChat = data.payload as Chat;
        setChats((prev) => {
          const exists = prev.some(
            (chat) =>
              chat.chatId === newChat.chatId &&
              chat.platform === newChat.platform
          );
          return exists
            ? prev.map((chat) =>
                chat.chatId === newChat.chatId &&
                chat.platform === newChat.platform
                  ? { ...chat, ...newChat }
                  : chat
              )
            : [...prev, newChat];
        });
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
      <Typography variant="h6" p={2}>
        Чаты
      </Typography>
      <List sx={{ width: "100%", bgcolor: "background.paper" }}>
        {chats.map((chat, index) => (
          <Box key={`${chat.platform}:${chat.chatId}`}>
            <ListItem
              button
              alignItems="flex-start"
              onClick={() => onSelect(chat)}
            >
              <ListItemAvatar>
                <Badge
                  color="error"
                  variant="dot"
                  invisible={!chat.notification}
                >
                  <Avatar src={chat.avatar} />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography fontWeight={600}>{chat.userName}</Typography>
                }
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      noWrap
                    >
                      {chat.lastMessage || "Нет сообщений"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "gray" }}
                    >
                      {new Date(chat.updatedAt).toLocaleTimeString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
            {index < chats.length - 1 && (
              <Divider variant="inset" component="li" />
            )}
          </Box>
        ))}
      </List>
    </Box>
  );
};
