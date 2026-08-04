export type SendSmsInput = {
  to: string;
  body: string;
};

export type SendSmsResult = {
  /** true if actually handed off to a real provider, false if only logged (no provider configured). */
  delivered: boolean;
  provider: 'twilio' | 'log';
};

/**
 * Sends an SMS via Twilio's REST API (no SDK dependency — a single fetch call
 * with HTTP Basic Auth, mirroring the pattern in @workspace/email).
 *
 * Falls back to logging the message to stdout when TWILIO_ACCOUNT_SID /
 * TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER are not all set, so the rest of the
 * app keeps working before a provider is configured.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.info(`[sms:log-only] No Twilio credentials configured — logging instead of sending.\n  to: ${input.to}\n  body: ${input.body}`);
    return { delivered: false, provider: 'log' };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: input.to, From: from, Body: input.body }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Twilio API error (${response.status}): ${body}`);
  }

  return { delivered: true, provider: 'twilio' };
}
