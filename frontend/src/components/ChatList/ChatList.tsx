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
  Divider,
  CircularProgress,
} from "@mui/material";
import { fetchChats } from "../../../services/api";
import type { Chat } from "../../types";
import { useChatContext } from "@/context/ChatContext";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";

type ChatListProps = {
  onSelect: (chat: Chat) => void;
};

export const ChatList = ({ onSelect }: ChatListProps) => {
  const { chats, setChats, selectedChat } = useChatContext();
  const [isReady, setIsReady] = useState(false);
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
      `ws://94.228.118.190/:${PORT}/?chatId=admin&platform=admin`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "welcome") {
        console.log("🟢 WebSocket ready");
        setIsReady(true);
      }

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

    return () => {
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, []);

  if (!isReady) {
    return (
      <Box
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" p={2}>
        Чаты
      </Typography>
      <List sx={{ width: "100%", bgcolor: "background.paper" }}>
        {chats.map((chat, index) => (
          <Box key={`${chat.platform}:${chat.chatId}`}>
            <ListItem
              sx={{
                cursor: "pointer",
                alignItems: "flex-start",
                backgroundColor:
                  selectedChat &&
                  selectedChat.chatId === chat.chatId &&
                  selectedChat.platform === chat.platform
                    ? "rgba(0, 0, 0, 0.04)"
                    : "transparent",
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
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
              {chat.platform === "telegram" ? (
                <TelegramIcon />
              ) : chat.platform === "whatsapp" ? (
                <WhatsAppIcon />
              ) : null}
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
                      sx={{
                        display: "inline-block",
                        maxWidth: "100%",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
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
