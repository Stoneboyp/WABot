import { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { fetchChats } from '../../../services/api';

interface Chat {
  id: number;
  userName: string;
  lastMessage?: string;
  updatedAt: string;
}

export const ChatList = ({ onSelect }: { onSelect: (id: number) => void }) => {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const loadChats = async () => {
      const data = await fetchChats();
      setChats(data);
    };
    loadChats();
    const interval = setInterval(loadChats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <List>
      {chats.map(chat => (
        <ListItem key={chat.id} button onClick={() => onSelect(chat.id)}>
          <ListItemText
            primary={chat.userName}
            secondary={
              <>
                <Typography variant="body2">{chat.lastMessage}</Typography>
                <Typography variant="caption">
                  {new Date(chat.updatedAt).toLocaleTimeString()}
                </Typography>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};