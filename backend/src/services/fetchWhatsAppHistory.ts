const instanceId = process.env.WA_MANAGER_ID_INSTANCE!;
const apiToken = process.env.WA_API_TOKEN_INSTANCE!;
const apiUrl = `https://api.green-api.com/waInstance${instanceId}`;

export async function fetchWhatsAppHistory(chatId: string, count = 20) {
  const url = `${apiUrl}/getChatHistory/${apiToken}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, count }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch WA history (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const history = data.map((m: any) => ({
    role: m.type === "incoming" ? "user" : "assistant",
    content: m.textMessage || m.extendedTextMessage?.text || "",
    timestamp: new Date(m.timestamp * 1000).toISOString(),
  }));

  return history;
}
