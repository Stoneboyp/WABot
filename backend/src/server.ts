// server.ts
import express from "express";
import http from "http";
import cors from "cors";
import chatApi from "./api/chat-api";
import { bot } from "./adapters/telegram/bot";
import { setupWebSocket } from "./ws/socket-server"; // 👈 создадим это
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// HTTP + WebSocket на одном сервере
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// API маршруты
app.use("/api", chatApi);

// Инициализируем WebSocket
setupWebSocket(server);

// Запуск сервера
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});

// Запуск Telegram-бота
bot
  .start()
  .then(() => {
    console.log("🤖 Telegram бот запущен");
  })
  .catch((err) => {
    console.error("Ошибка запуска бота:", err);
  });
