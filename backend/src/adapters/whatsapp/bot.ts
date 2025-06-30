// whatsapp/bot.ts
import { initWhatsAppAdapter } from "./whatsapp-adapter";

export async function startWhatsAppBot() {
  try {
    await initWhatsAppAdapter();
    console.log("📱 WhatsApp адаптер запущен");
  } catch (err) {
    console.error("Ошибка запуска WhatsApp:", err);
  }
}
