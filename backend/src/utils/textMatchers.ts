// src/utils/textMatchers.ts

export function isConfirmationResponse(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return ["да", "давай", "подтверждаю", "хочу", "оформляй", "можно"].some((w) =>
    normalized.includes(w)
  );
}
