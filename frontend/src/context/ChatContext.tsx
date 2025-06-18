import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Chat } from "../types";

type ChatContextType = {
  selectedChat: Chat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  isOperatorMode: boolean;
  setIsOperatorMode: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isOperatorMode, setIsOperatorMode] = useState(false);
  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        isOperatorMode,
        setIsOperatorMode,
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
