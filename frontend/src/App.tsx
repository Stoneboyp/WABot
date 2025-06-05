import { CssBaseline } from "@mui/material";
import { ChatProvider } from "./context/ChatContext";
import { ChatLayout } from "@components/ChatLayout/ChatLayout";

const App = () => {
  return (
    <>
      <CssBaseline />
      <ChatProvider>
        <ChatLayout />
      </ChatProvider>
    </>
  );
};

export default App;
