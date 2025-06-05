// src/components/ChatWindow.tsx
import { useEffect, useState } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { MessageInput } from '@components/MessageInput/MessageInput';
import { fetchMessages, sendMessage } from '../../../services/api';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

export const ChatWindow = ({ chatId }: { chatId: number }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const loadMessages = async () => {
      const data = await fetchMessages(chatId);
      setMessages(data);
    };
    loadMessages();
  }, [chatId]);

  const handleSend = async (text: string) => {
    await sendMessage(chatId, text);
    setMessages([...messages, {
      id: Date.now(),
      text,
      sender: 'operator',
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <Box flexGrow={1} overflow="auto" p={2}>
        {messages.map(msg => (
          <Box key={msg.id} mb={2}>
            <Typography variant="caption">{msg.sender}</Typography>
            <Typography>{msg.text}</Typography>
            <Divider />
          </Box>
        ))}
      </Box>
      <MessageInput onSend={handleSend} />
    </Box>
  );
};