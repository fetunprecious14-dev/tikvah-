export type SendTelegramInput = {
  text: string;
};

export type SendTelegramResult = {
  /** true if actually handed off to Telegram, false if only logged (no bot configured). */
  delivered: boolean;
  provider: 'telegram' | 'log';
};

/**
 * Sends a message via the Telegram Bot API (no SDK dependency — a single fetch call).
 *
 * Falls back to logging the message to stdout when TELEGRAM_BOT_TOKEN /
 * TELEGRAM_CHAT_ID are not both set, so the rest of the app keeps working
 * before a bot is configured. Sent as plain text (no parse_mode), so message
 * content is never interpreted as Markdown/HTML by Telegram.
 */
export async function sendTelegramMessage(input: SendTelegramInput): Promise<SendTelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    // Alert text carries a user's name, message preview and risk categories — never log it in production.
    if (process.env.NODE_ENV === 'production') {
      console.warn('[telegram:log-only] No TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID configured — message not sent; contents withheld from logs.');
    } else {
      console.info(`[telegram:log-only] No TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID configured — logging instead of sending.\n  text: ${input.text}`);
    }
    return { delivered: false, provider: 'log' };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: input.text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Telegram API error (${response.status}): ${body}`);
  }

  return { delivered: true, provider: 'telegram' };
}
