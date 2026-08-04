import { eq } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  notificationsTable,
  usersTable,
  type Conversation,
  type Message,
} from "@workspace/db";
import { sendEmail, replyNotificationEmail, urgentAlertEmail } from "@workspace/email";
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

  if (isUrgent) {
    await alertAdminOfUrgentMessage(conversation, safety.categories);
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

  try {
    await sendEmail(
      replyNotificationEmail({
        to: user.email,
        name: user.name,
        conversationUrl: `${config.appUrl}/conversations/${conversation.id}`,
      }),
    );
  } catch (error) {
    logger.error({ error, conversationId: conversation.id }, "Failed to send reply notification email");
  }
}

async function alertAdminOfUrgentMessage(conversation: Conversation, categories: string[]): Promise<void> {
  if (!config.adminAlertEmail) {
    logger.warn({ conversationId: conversation.id, categories }, "Urgent message flagged, but ADMIN_ALERT_EMAIL is not set — no alert email sent");
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, conversation.userId)).limit(1);

  try {
    await sendEmail(
      urgentAlertEmail({
        to: config.adminAlertEmail,
        userName: user?.name ?? "A Tikvah user",
        categories,
        conversationUrl: `${config.appUrl}/admin/conversations/${conversation.id}`,
      }),
    );
  } catch (error) {
    logger.error({ error, conversationId: conversation.id }, "Failed to send urgent alert email");
  }
}

export function conversationPreview(messages: Message[]): string {
  const last = messages[messages.length - 1];
  if (!last) return "";
  return last.body.length > 160 ? `${last.body.slice(0, 159)}…` : last.body;
}
