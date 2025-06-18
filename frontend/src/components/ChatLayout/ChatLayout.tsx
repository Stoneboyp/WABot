import { Box } from "@mui/material";
import { ChatList } from "@components/ChatList/ChatList";
import { ChatWindow } from "@components/ChatWindow/ChatWindow";
import { useChatContext } from "../../context/ChatContext";
import { Typography } from "@mui/material";

export const ChatLayout = () => {
  const { selectedChat, setSelectedChat } = useChatContext();

  return (
    <Box display="flex" height="100vh">
      {/* Левая колонка со списком чатов */}
      <Box width="320px" borderRight="1px solid #ccc" overflow="auto">
        <ChatList onSelect={(chat) => setSelectedChat(chat)} />
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
