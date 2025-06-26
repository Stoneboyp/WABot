import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Chat, Message } from "../types";
import { clearNotification } from "../../services/api";
import { useWebSocket } from "@/hooks/useWebSocket";

type ChatContextType = {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChat: Chat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  isOperatorMode: boolean;
  setIsOperatorMode: React.Dispatch<React.SetStateAction<boolean>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  unreadMessages: Record<string, number>;
  setUnreadMessages: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  clearChatNotification: (chatId: string, platform: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isOperatorMode, setIsOperatorMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>(
    {}
  );

  useWebSocket("*", "*", (data) => {
    if (data.type === "new_chat") {
      const updated = data.payload;
      setChats((prev) => {
        const exists = prev.find(
          (c) => c.chatId === updated.chatId && c.platform === updated.platform
        );
        if (exists) {
          return prev.map((c) =>
            c.chatId === updated.chatId && c.platform === updated.platform
              ? { ...c, ...updated }
              : c
          );
        } else {
          return [...prev, updated];
        }
      });
    }
  });

  const clearChatNotification = async (chatId: string, platform: string) => {
    console.log(chats);

    try {
      await clearNotification(chatId, platform);
      setChats((prev) =>
        prev.map((chat) =>
          chat.chatId === chatId && chat.platform === platform
            ? { ...chat, notification: false }
            : chat
        )
      );
    } catch (error) {
      console.error("❌ Failed to clear notification", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        isOperatorMode,
        setIsOperatorMode,
        messages,
        setMessages,
        unreadMessages,
        setUnreadMessages,
        clearChatNotification,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
