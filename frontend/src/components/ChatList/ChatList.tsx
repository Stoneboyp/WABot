// src/components/ChatList/ChatList.tsx
import { useEffect, useState } from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import { fetchChats } from "../../../services/api";
import type { Chat } from "../../types";

type ChatListProps = {
  onSelect: (chat: Chat) => void;
};

export const ChatList = ({ onSelect }: ChatListProps) => {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const loadChats = async () => {
      const data = await fetchChats();
      setChats(data);
    };
    loadChats();
  }, []);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Список чатов
      </Typography>
      <List>
        {chats.map((chat) => (
          <ListItem key={chat.chatId} button onClick={() => onSelect(chat)}>
            <ListItemAvatar>
              <Avatar src={chat.avatar} />
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
