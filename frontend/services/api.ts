import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const fetchChats = async () => {
  const response = await api.get("/chats");
  return response.data;
};

export const sendMessage = async (chatId: number, text: string) => {
  await api.post(`/chats/${chatId}/send`, { text });
};

export const fetchMessages = async (chatId: number) => {
  const response = await api.get(`/chats/${chatId}/messages`);
  return response.data;
};
