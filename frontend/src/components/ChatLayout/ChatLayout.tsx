import { Box, Container, Grid, Typography } from "@mui/material";
import { ChatList } from "@components/ChatList/ChatList";
import { ChatWindow } from "@components/ChatWindow/ChatWindow";
import { useChatContext } from "../../context/ChatContext";

export const ChatLayout = () => {
  const { selectedChat, setSelectedChat } = useChatContext();

  return (
    <Container maxWidth="lg">
      <Box
        my={4}
        sx={{
          height: "80vh",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          boxShadow: 3,
        }}
      >
        <Grid container>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{ borderRight: "1px solid #ccc", height: "100%" }}
          >
            <ChatList onSelect={(chat) => setSelectedChat(chat)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            {selectedChat !== null ? (
              <ChatWindow chat={selectedChat} />
            ) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100%"
                bgcolor="#f5f5f5"
              >
                <Typography variant="h6">Выберите чат</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
