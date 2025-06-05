import { useEffect, useState } from "react";
import { Box, CssBaseline, Container, Grid, Typography } from "@mui/material";
import { ChatList } from "./components/ChatList/ChatList";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";

const App = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  useEffect(() => {
    console.log("selectedChat:", selectedChat);
  }, [selectedChat]);

  return (
    <>
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
              item
              xs={12}
              md={4}
              sx={{ borderRight: "1px solid #ccc", height: "100%" }}
            >
              <ChatList onSelect={setSelectedChat} />
            </Grid>
            <Grid item xs={12} md={8}>
              {selectedChat !== null ? (
                <ChatWindow chatId={selectedChat} />
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
    </>
  );
};

export default App;
