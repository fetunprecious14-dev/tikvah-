export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult = {
  /** true if actually handed off to a real provider, false if only logged (no provider configured). */
  delivered: boolean;
  provider: 'resend' | 'log';
};

/**
 * Sends an email via Resend's HTTP API (no SDK dependency — a single fetch call).
 *
 * Falls back to logging the email to stdout when RESEND_API_KEY is not set, so the
 * rest of the app keeps working before a provider is configured. Set RESEND_API_KEY
 * and EMAIL_FROM to send for real.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Tikvah <onboarding@resend.dev>';

  if (!apiKey) {
    console.info(
      `[email:log-only] No RESEND_API_KEY configured — logging instead of sending.\n` +
        `  to: ${input.to}\n  subject: ${input.subject}\n  text: ${input.text}`,
    );
    return { delivered: false, provider: 'log' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }

  return { delivered: true, provider: 'resend' };
}
