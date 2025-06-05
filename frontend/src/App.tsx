import { useState } from 'react';
import { Box, CssBaseline, Container, Grid, Typography } from '@mui/material';
import { ChatList } from './components/ChatList/ChatList';
import { ChatWindow } from './components/ChatWindow/ChatWindow';

const App = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box my={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ChatList onSelect={setSelectedChat} />
            </Grid>
            <Grid item xs={12} md={8}>
              {selectedChat ? (
                <ChatWindow chatId={selectedChat} />
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography>Выберите чат</Typography>
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