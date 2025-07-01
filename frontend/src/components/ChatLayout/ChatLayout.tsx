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
    <Box display="flex" height="100vh" width="100vw" overflow="hidden">
      <Box
        width="30%"
        borderRight="1px solid #ccc"
        overflow="auto"
        sx={{ minWidth: "300px", maxWidth: "30%" }} // чтобы не прыгала
      >
        <ChatList onSelect={handleSelectChat} />
      </Box>

      <Box width="70%" overflow="hidden" sx={{ minWidth: "60%" }}>
        {selectedChat ? (
          <ChatWindow chat={selectedChat} />
        ) : (
          <Box
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="#f5f5f5"
          >
            <Typography variant="h6" color="textSecondary">
              Выберите чат, чтобы начать диалог
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
