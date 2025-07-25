import dotenv from "dotenv";
dotenv.config();

import { handleIncomingMessage } from "../../core/handleIncomingMessage";
import whatsAppClient from "@green-api/whatsapp-api-client";
import { saveMessage, getChat, ChatPlatform } from "../../store/chatStore";

const idInstance = process.env.WA_MANAGER_ID_INSTANCE!;
const apiTokenInstance = process.env.WA_API_TOKEN_INSTANCE!;
const BASE_URL = `https://api.green-api.com/waInstance${idInstance}`;
const allowedChatId = process.env.WA_TEST_CHAT_ID!;
const platform: ChatPlatform = "whatsapp";

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

  while (true) {
    try {
      const response = await restAPI.webhookService.receiveNotification();
      if (!response) continue;

      const { body: webhookBody, receiptId } = response;

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

          if (msg && chatId === allowedChatId) {
            saveMessage(platform, chatId, userName, {
              role: "user",
              content: msg,
              timestamp: new Date(),
            });
            const history = getChat(platform, chatId)?.messages || [];
            console.log(history);

            await handleIncomingMessage({
              chatId,
              platform,
              userName,
              text: msg,
              history,
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

      await restAPI.webhookService.deleteNotification(receiptId);
    } catch (err) {
      console.error("❌ Ошибка в WhatsApp poll loop:", err);
      await new Promise((res) => setTimeout(res, 5000));
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
