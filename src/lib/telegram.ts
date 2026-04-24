const TELEGRAM_RECIPIENTS: Array<{ chatId: string; name: string }> = [
  { chatId: "8665156164", name: "Cristofer" },
  { chatId: "1572834634", name: "Asaí" },
];

async function sendOne(chatId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyAdminsTelegram(text: string): Promise<void> {
  await Promise.allSettled(TELEGRAM_RECIPIENTS.map((r) => sendOne(r.chatId, text)));
}

/**
 * Notify admins through both channels (Telegram + Twilio SMS). Telegram is the
 * primary path since it's free and doesn't depend on Twilio 10DLC registration.
 * Twilio SMS runs as best-effort backup.
 */
export async function notifyAdminsAll(text: string): Promise<void> {
  const { notifyAdmins } = await import("./twilio");
  await Promise.allSettled([
    notifyAdminsTelegram(text),
    notifyAdmins(text).catch((e) => console.error("📱 Admin SMS error:", e)),
  ]);
}
