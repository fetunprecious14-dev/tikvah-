import webpush from 'web-push';

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type SendWebPushInput = {
  subscription: PushSubscriptionInput;
  payload: {
    title: string;
    body: string;
    url: string;
  };
};

export type SendWebPushResult =
  | { delivered: true; provider: 'web-push' }
  | { delivered: false; provider: 'log' }
  /** The push service reported this subscription as gone (uninstalled / permission revoked) — safe to delete it. */
  | { delivered: false; provider: 'web-push'; expired: true };

let vapidConfigured = false;

/**
 * Web Push (unlike the plain-fetch email/sms/telegram integrations) requires
 * VAPID JWT signing plus per-subscription ECDH + AES128GCM payload encryption
 * (RFC 8291/8292) — hand-rolling that crypto correctly is not worth the risk,
 * so this wraps the standard `web-push` library instead of a bare fetch call.
 */
function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Sends a push notification via the Web Push protocol.
 *
 * Falls back to logging when VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
 * are not all set, so the rest of the app keeps working before push is configured.
 */
export async function sendWebPush(input: SendWebPushInput): Promise<SendWebPushResult> {
  if (!ensureVapidConfigured()) {
    // The endpoint identifies a user's device and the payload carries notification
    // content — never write either to logs in production.
    if (process.env.NODE_ENV === 'production') {
      console.warn('[webpush:log-only] No VAPID keys configured — push not sent; contents withheld from logs.');
    } else {
      console.info(
        `[webpush:log-only] No VAPID keys configured — logging instead of sending.\n` +
          `  endpoint: ${input.subscription.endpoint}\n  payload: ${JSON.stringify(input.payload)}`,
      );
    }
    return { delivered: false, provider: 'log' };
  }

  try {
    await webpush.sendNotification(input.subscription, JSON.stringify(input.payload));
    return { delivered: true, provider: 'web-push' };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { delivered: false, provider: 'web-push', expired: true };
    }
    throw error;
  }
}

/** The public key browsers need to create a push subscription, or null if push isn't configured. */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}
