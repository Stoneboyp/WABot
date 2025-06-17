import express from "express";
import chatApi from "./api/chat-api";
import { bot } from "./adapters/telegram/bot";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({}));

// Middleware
app.use(express.json());

// API Routes
app.use("/api", chatApi);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API доступно по http://localhost:${PORT}/api`);
});

// Инициализация бота
bot
  .start()
  .then(() => {
    console.log("🤖 Telegram бот запущен");
  })
  .catch((err) => {
    console.error("Ошибка запуска бота:", err);
  });
