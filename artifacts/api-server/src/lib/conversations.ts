import { eq } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  notificationsTable,
  pushSubscriptionsTable,
  usersTable,
  type Conversation,
  type Message,
} from "@workspace/db";
import { sendEmail, replyNotificationEmail, urgentAlertEmail, newMessageEmail } from "@workspace/email";
import { sendSms } from "@workspace/sms";
import { sendTelegramMessage } from "@workspace/telegram";
import { sendWebPush } from "@workspace/webpush";
import { assessSafety } from "./safety";
import { config } from "./config";
import { logger } from "./logger";

export async function loadMessages(conversationId: string): Promise<Message[]> {
  return db.select().from(messagesTable).where(eq(messagesTable.conversationId, conversationId)).orderBy(messagesTable.createdAt);
}

/**
 * Appends a message to a conversation, running the server-side safety check on
 * user-authored text, updating conversation status, and firing notifications /
 * alert emails. This is the single write path for both the user-facing and
 * admin-facing reply endpoints so flagging/alerting can't be bypassed.
 */
export async function appendMessage(params: {
  conversation: Conversation;
  senderType: "user" | "admin";
  senderId: string;
  body: string;
}): Promise<Message> {
  const { conversation, senderType, senderId, body } = params;

  const safety = senderType === "user" ? assessSafety(body) : { risk: "none" as const, categories: [] };
  const isUrgent = safety.risk === "high";

  const [message] = await db
    .insert(messagesTable)
    .values({
      conversationId: conversation.id,
      senderType,
      senderId,
      body,
      riskCategories: isUrgent ? safety.categories : null,
    })
    .returning();

  const nextStatus = isUrgent ? "urgent" : senderType === "admin" ? "responded" : "awaiting_reply";
  await db
    .update(conversationsTable)
    .set({ status: nextStatus, lastMessageAt: message.createdAt })
    .where(eq(conversationsTable.id, conversation.id));

  if (senderType === "admin") {
    await notifyUserOfReply(conversation);
  }

  if (senderType === "user") {
    await notifyAdminOfNewMessage(conversation, message, isUrgent, safety.categories);
  }

  return message;
}

async function notifyUserOfReply(conversation: Conversation): Promise<void> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, conversation.userId)).limit(1);
  if (!user) return;

  await db.insert(notificationsTable).values({
    userId: user.id,
    type: "reply",
    title: "You have a reply",
    body: "A member of the Tikvah team has written back to you.",
    conversationId: conversation.id,
  });

  const conversationUrl = `${config.appUrl}/conversations/${conversation.id}`;

  try {
    await sendEmail(replyNotificationEmail({ to: user.email, name: user.name, conversationUrl }));
  } catch (error) {
    logger.error({ error, conversationId: conversation.id }, "Failed to send reply notification email");
  }

  await pushToUserDevices(user.id, {
    title: "You have a reply",
    body: "A member of the Tikvah team has written back to you.",
    url: conversationUrl,
  });
}

/**
 * Sends a Web Push notification to every device the user has subscribed on.
 * A subscription the push service reports as gone (uninstalled app, revoked
 * permission) is pruned so we stop trying it.
 */
async function pushToUserDevices(userId: string, payload: { title: string; body: string; url: string }): Promise<void> {
  const subscriptions = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));

  for (const subscription of subscriptions) {
    try {
      const result = await sendWebPush({
        subscription: { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        payload,
      });
      if ("expired" in result && result.expired) {
        await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, subscription.id));
      }
    } catch (error) {
      logger.error({ error, userId, subscriptionId: subscription.id }, "Failed to send push notification");
    }
  }
}

/**
 * Notifies the admin of every new user message (via email and/or Telegram, whichever
 * is configured), and additionally texts ADMIN_ALERT_PHONE when the message was
 * flagged urgent — SMS costs per message, so it stays reserved for the cases that
 * genuinely can't wait.
 */
async function notifyAdminOfNewMessage(conversation: Conversation, message: Message, isUrgent: boolean, categories: string[]): Promise<void> {
  const hasAnyChannel = Boolean(config.adminAlertEmail || config.adminAlertTelegramChatId || (isUrgent && config.adminAlertPhone));
  if (!hasAnyChannel) {
    logger.warn(
      { conversationId: conversation.id, isUrgent },
      "New user message, but no admin alert channel is configured (ADMIN_ALERT_EMAIL, TELEGRAM_CHAT_ID, or ADMIN_ALERT_PHONE for urgent messages) — no alert sent",
    );
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, conversation.userId)).limit(1);
  const userName = user?.name ?? "A Tikvah user";
  const conversationUrl = `${config.appUrl}/admin/conversations/${conversation.id}`;
  const preview = message.body.length > 160 ? `${message.body.slice(0, 159)}…` : message.body;

  if (config.adminAlertEmail) {
    try {
      const email = isUrgent
        ? urgentAlertEmail({ to: config.adminAlertEmail, userName, categories, conversationUrl })
        : newMessageEmail({ to: config.adminAlertEmail, userName, preview, conversationUrl });
      await sendEmail(email);
    } catch (error) {
      logger.error({ error, conversationId: conversation.id }, "Failed to send admin alert email");
    }
  }

  if (config.adminAlertTelegramChatId) {
    try {
      const text = isUrgent
        ? `🚨 Urgent submission from ${userName} (${categories.join(', ')}).\n${conversationUrl}`
        : `New message from ${userName}:\n"${preview}"\n${conversationUrl}`;
      await sendTelegramMessage({ text });
    } catch (error) {
      logger.error({ error, conversationId: conversation.id }, "Failed to send admin alert Telegram message");
    }
  }

  if (isUrgent && config.adminAlertPhone) {
    try {
      await sendSms({
        to: config.adminAlertPhone,
        body: `Tikvah: urgent submission from ${userName} (${categories.join(', ')}). Review: ${conversationUrl}`,
      });
    } catch (error) {
      logger.error({ error, conversationId: conversation.id }, "Failed to send urgent alert SMS");
    }
  }
}

export function conversationPreview(messages: Message[]): string {
  const last = messages[messages.length - 1];
  if (!last) return "";
  return last.body.length > 160 ? `${last.body.slice(0, 159)}…` : last.body;
}
