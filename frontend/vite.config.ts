/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const baseUrl = process.env.VITE_API_URL;
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: baseUrl,
        changeOrigin: true,
      },
    },
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
    },
  },
});
