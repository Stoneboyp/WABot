import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const fetchChats = async () => {
  const response = await api.get("/chats");
  return response.data;
};

export const fetchMessages = async (chatId: string, platform: string) => {
  const response = await api.get(`/chats/${chatId}?platform=${platform}`);
  return response.data;
};

export const sendMessage = async (
  chatId: string,
  text: string,
  platform: string,
  mode: "ai" | "operator" = "ai"
) => {
  const response = await api.post(`/chats/${chatId}/send`, {
    text,
    platform,
    mode,
  });
  return response.data;
};

export const sendOperatorReply = async (
  chatId: string,
  text: string,
  platform: string
) => {
  const response = await api.post(`/chats/${chatId}/reply`, { text, platform });
  return response.data;
};

export const updateChatMode = async (
  chatId: string,
  platform: string,
  mode: "operator" | "ai"
) => {
  return api.post(`/chats/${chatId}/mode`, {
    platform,
    mode,
  });
};

export async function clearNotification(chatId: string, platform: string) {
  const response = await api.post(
    `/chats/${platform}/${chatId}/clear-notification`
  );
  if (!response) throw new Error("Failed to clear notification");
}
