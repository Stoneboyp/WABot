import { Box } from "@mui/material";
import { ChatList } from "@components/ChatList/ChatList";
import { ChatWindow } from "@components/ChatWindow/ChatWindow";
import { Typography } from "@mui/material";
import { useChatContext } from "../../context/ChatContext";
import { clearNotification } from "../../../services/api";
import type { Chat } from "@/types";

export const ChatLayout = () => {
  const { selectedChat, setSelectedChat, clearChatNotification } =
    useChatContext();

  const handleSelectChat = async (chat: Chat) => {
    await clearChatNotification(chat.chatId, chat.platform);
    setSelectedChat(chat);
  };

  return (
    <Box display="flex" height="100vh">
      {/* Левая колонка со списком чатов */}
      <Box width="320px" borderRight="1px solid #ccc" overflow="auto">
        <ChatList onSelect={handleSelectChat} />
      </Box>

      {/* Правая часть — окно чата или заглушка */}
      <Box flexGrow={1} position="relative">
        {selectedChat ? (
          <ChatWindow chat={selectedChat} />
        ) : (
          <Box
            height="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            bgcolor="#f5f5f5"
          >
            <Typography variant="h6" mt={2} color="textSecondary">
              Выберите чат, чтобы начать диалог
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
