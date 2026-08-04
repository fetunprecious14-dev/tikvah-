import { Router, type IRouter } from "express";
import { and, arrayContains, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  usersTable,
  resourceEventsTable,
  type Conversation,
  type Message,
  type User,
} from "@workspace/db";
import { AdminListConversationsQueryParams, AdminUpdateConversationBody, CreateConversationMessageBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/session";
import { validateBody, parseQuery } from "../lib/validate";
import { appendMessage, loadMessages, conversationPreview } from "../lib/conversations";

const router: IRouter = Router();

router.use("/admin", requireAuth, requireAdmin);

const TIKVAH_TEAM_LABEL = "Tikvah team";

function serializeMessage(message: Message, userName: string) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderType: message.senderType,
    senderName: message.senderType === "admin" ? TIKVAH_TEAM_LABEL : userName,
    body: message.body,
    riskCategories: message.riskCategories,
    createdAt: message.createdAt,
  };
}

function serializeAdminConversation(conversation: Conversation, messages: Message[], user: User) {
  return {
    id: conversation.id,
    status: conversation.status,
    tags: conversation.tags,
    preview: conversationPreview(messages),
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    user: { id: user.id, name: user.name, email: user.email },
  };
}

router.get("/admin/conversations", async (req, res) => {
  const { search, status, tag } = parseQuery(AdminListConversationsQueryParams, req.query);

  const conditions = [
    status ? eq(conversationsTable.status, status) : undefined,
    tag ? arrayContains(conversationsTable.tags, [tag]) : undefined,
    search ? or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`)) : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> => condition != null);

  const rows = await db
    .select({ conversation: conversationsTable, user: usersTable })
    .from(conversationsTable)
    .innerJoin(usersTable, eq(conversationsTable.userId, usersTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    // Urgent conversations always surface first so nothing critical is missed
    // in the default view; within that, most recently active first.
    .orderBy(sql`case when ${conversationsTable.status} = 'urgent' then 0 else 1 end`, desc(conversationsTable.lastMessageAt));

  const withMessages = await Promise.all(
    rows.map(async ({ conversation, user }) => ({ conversation, user, messages: await loadMessages(conversation.id) })),
  );

  res.status(200).json(withMessages.map(({ conversation, user, messages }) => serializeAdminConversation(conversation, messages, user)));
});

router.get("/admin/conversations/:id", async (req, res) => {
  const [row] = await db
    .select({ conversation: conversationsTable, user: usersTable })
    .from(conversationsTable)
    .innerJoin(usersTable, eq(conversationsTable.userId, usersTable.id))
    .where(eq(conversationsTable.id, String(req.params.id)))
    .limit(1);

  if (!row) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }

  const messages = await loadMessages(row.conversation.id);
  res.status(200).json({
    ...serializeAdminConversation(row.conversation, messages, row.user),
    messages: messages.map(message => serializeMessage(message, row.user.name)),
  });
});

router.patch("/admin/conversations/:id", validateBody(AdminUpdateConversationBody), async (req, res) => {
  const { status, tags } = req.body as { status?: Conversation["status"]; tags?: string[] };

  const [updated] = await db
    .update(conversationsTable)
    .set({ ...(status ? { status } : {}), ...(tags ? { tags } : {}) })
    .where(eq(conversationsTable.id, String(req.params.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
  const messages = await loadMessages(updated.id);
  res.status(200).json(serializeAdminConversation(updated, messages, user!));
});

router.post("/admin/conversations/:id/messages", validateBody(CreateConversationMessageBody), async (req, res) => {
  const { body } = req.body as { body: string };

  const [conversation] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, String(req.params.id))).limit(1);
  if (!conversation) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }

  const message = await appendMessage({ conversation, senderType: "admin", senderId: req.user!.id, body });
  res.status(201).json(serializeMessage(message, TIKVAH_TEAM_LABEL));
});

router.get("/admin/analytics", async (req, res) => {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [totalUsersRow] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [newRegistrationsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(gte(usersTable.createdAt, sevenDaysAgo));

  const [activeUsersRow] = await db
    .select({ count: sql<number>`count(distinct ${messagesTable.senderId})::int` })
    .from(messagesTable)
    .where(and(eq(messagesTable.senderType, "user"), gte(messagesTable.createdAt, thirtyDaysAgo)));

  const statusCounts = await db
    .select({ status: conversationsTable.status, count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .groupBy(conversationsTable.status);

  const countFor = (status: Conversation["status"]) => statusCounts.find(row => row.status === status)?.count ?? 0;
  const totalConversations = statusCounts.reduce((sum, row) => sum + row.count, 0);

  const [resourceViewsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(resourceEventsTable)
    .where(gte(resourceEventsTable.createdAt, thirtyDaysAgo));

  // Average response time: for each conversation, the gap between its first user
  // message and its first admin reply. Computed in application code since the
  // dataset is small at this stage; revisit with a SQL window function if it grows.
  const allMessages = await db.select().from(messagesTable).orderBy(messagesTable.createdAt);
  const byConversation = new Map<string, Message[]>();
  for (const message of allMessages) {
    const list = byConversation.get(message.conversationId) ?? [];
    list.push(message);
    byConversation.set(message.conversationId, list);
  }

  const responseTimesMs: number[] = [];
  for (const messages of byConversation.values()) {
    const firstUserMessage = messages.find(message => message.senderType === "user");
    const firstAdminReply = messages.find(message => message.senderType === "admin" && (!firstUserMessage || message.createdAt > firstUserMessage.createdAt));
    if (firstUserMessage && firstAdminReply) {
      responseTimesMs.push(firstAdminReply.createdAt.getTime() - firstUserMessage.createdAt.getTime());
    }
  }
  const avgResponseTimeMinutes = responseTimesMs.length
    ? Math.round(responseTimesMs.reduce((sum, ms) => sum + ms, 0) / responseTimesMs.length / 60000)
    : null;

  res.status(200).json({
    totalUsers: totalUsersRow.count,
    activeUsers30d: activeUsersRow.count,
    newRegistrations7d: newRegistrationsRow.count,
    totalConversations,
    awaitingReplyCount: countFor("awaiting_reply"),
    urgentCount: countFor("urgent"),
    respondedCount: countFor("responded"),
    archivedCount: countFor("archived"),
    avgResponseTimeMinutes,
    resourceViews30d: resourceViewsRow.count,
  });
});

export default router;
