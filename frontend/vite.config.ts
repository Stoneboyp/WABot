/// <reference types="vite/client" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
const baseUrl = import.meta.env.VITE_WS_URL;
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
