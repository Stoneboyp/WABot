// src/core/logger.ts

import winston from "winston";
import fs from "fs";
import path from "path";

const logDir = path.resolve("logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({ filename: path.join(logDir, "app.log") }),
  ],
});

export default logger;
