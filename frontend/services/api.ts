import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const fetchChats = async () => {
  const response = await api.get("/chats");
  return response.data;
};

export const sendMessage = async (chatId: number, text: string) => {
  const response = await api.post(`/chats/${chatId}/send`, { text });
  return response.data; // вот здесь возвращаем данные (например { success, reply })
};
export const fetchMessages = async (chatId: number) => {
  const response = await api.get(`/chats/${chatId}`);
  return response.data;
};
export const sendOperatorReply = async (chatId: number, text: string) => {
  const response = await api.post(`/chats/${chatId}/reply`, { text });
  return response.data;
};
