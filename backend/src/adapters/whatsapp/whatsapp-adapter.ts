//whatsapp-adapter.ts
import dotenv from "dotenv";
dotenv.config();

import { handleIncomingMessage } from "../../core/handleIncomingMessage";

// Импортируем официальный клиент Green API
import whatsAppClient from "@green-api/whatsapp-api-client";

const idInstance = process.env.WA_MANAGER_ID_INSTANCE!;
const apiTokenInstance = process.env.WA_API_TOKEN_INSTANCE!;
const BASE_URL = `https://api.green-api.com/waInstance${idInstance}`;

export async function initWhatsAppAdapter() {
  if (process.env.ENABLE_WHATSAPP !== "true") {
    console.log("🚫 WhatsApp disabled by config");
    return;
  }

  const restAPI = whatsAppClient.restAPI({
    idInstance,
    apiTokenInstance,
  });

  console.log("📡 WhatsApp polling loop started");

  // 🔁 polling loop
  while (true) {
    try {
      const response = await restAPI.webhookService.receiveNotification();
      if (!response) continue;

      const webhookBody = response.body;
      const receiptId = response.receiptId;
      // console.log("📥 RAW webhook body:", JSON.stringify(webhookBody, null, 2));
      switch (webhookBody.typeWebhook) {
        case "incomingMessageReceived": {
          const type = webhookBody.messageData?.typeMessage;

          let msg: string | undefined;

          if (type === "textMessage") {
            msg = webhookBody.messageData.textMessageData?.textMessage;
          } else if (type === "extendedTextMessage") {
            msg = webhookBody.messageData.extendedTextMessageData?.text;
          } else {
            console.log(`⚠️ Неподдерживаемый тип сообщения: ${type}`);
          }

          const chatId = webhookBody.senderData?.chatId;
          const userName = webhookBody.senderData?.senderName || "WA User";

          console.log(
            `📥 Входящее WA сообщение: ${userName} (${chatId}): ${msg}`
          );
          // only test user
          const allowedChatId = process.env.WA_TEST_CHAT_ID;

          if (msg && chatId === allowedChatId) {
            await handleIncomingMessage({
              chatId,
              platform: "whatsapp",
              userName,
              text: msg,
              history: [],
            });
          } else {
            console.log(`🚫 Пропущено WA-сообщение от ${chatId}`);
          }

          break;
        }

        case "stateInstanceChanged": {
          console.log(
            `📶 WhatsApp статус инстанса: ${webhookBody.stateInstance}`
          );
          break;
        }

        default: {
          console.log(
            "📥 Необработанный тип webhook:",
            webhookBody.typeWebhook
          );
        }
      }

      // ✅ Обязательно удаляем уведомление, чтобы API не присылал его снова
      await restAPI.webhookService.deleteNotification(receiptId);
    } catch (err) {
      console.error("❌ Ошибка в WhatsApp poll loop:", err);
      await new Promise((res) => setTimeout(res, 5000)); // Пауза 5 сек при ошибке
    }
  }
}

export async function sendWhatsAppMessage(chatId: string, text: string) {
  await fetch(`${BASE_URL}/SendMessage/${apiTokenInstance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message: text }),
  });
}

//temp use pooling
// export async function handleWhatsAppWebhook(req: any, res: any) {
//   const body = req.body;
//   console.log("📩 WhatsApp webhook:", body);

//   if (body.messageData?.textMessageData) {
//     const chatId = body.senderData?.chatId;
//     const userName = body.senderData?.senderName || "WhatsApp User";
//     const text = body.messageData.textMessageData.textMessage;

//     if (chatId && text) {
//       await handleIncomingMessage({
//         chatId,
//         platform: "whatsapp",
//         userName,
//         text,
//         history: [], // можно позже внедрить хранилище истории
//       });
//     }
//   }

//   res.sendStatus(200);
// }
