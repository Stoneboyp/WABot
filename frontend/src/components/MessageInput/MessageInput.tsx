// src/components/MessageInput.tsx
import { useState } from 'react';
import { TextField, IconButton, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export const MessageInput = ({ onSend }: { onSend: (text: string) => void }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <Box display="flex" gap={1} p={1}>
      <TextField
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <IconButton onClick={handleSubmit}>
        <SendIcon />
      </IconButton>
    </Box>
  );
};