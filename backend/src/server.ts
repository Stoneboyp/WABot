// server.ts
import express from "express";
import http from "http";
import cors from "cors";
import chatApi from "./api/chat-api";
import { bot } from "./adapters/telegram/bot";
import { startWhatsAppBot } from "./adapters/whatsapp/bot";
import { setupWebSocket } from "./ws/socket-server";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const API_URL = process.env.API_URL || "http://localhost";

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
  console.log(`📡 API: ${API_URL}:${PORT}/api`);
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

// Запуск WhatsApp адаптера
startWhatsAppBot();
