// src/utils/textMatchers.ts

export function isConfirmationResponse(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return ["да", "давай", "подтверждаю", "хочу", "оформляй", "можно"].some((w) =>
    normalized.includes(w)
  );
}

export function isPromptingConfirmation(aiText: string): boolean {
  const norm = aiText.toLowerCase();
  return (
    norm.includes("подтвердите заявку") || norm.includes("оформить заявку")
  );
}
