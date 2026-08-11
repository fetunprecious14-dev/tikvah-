import { Router, type IRouter } from "express";
import { and, arrayContains, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import {
  db,
  conversationsTable,
  messagesTable,
  profilesTable,
  authUsersTable,
  resourcesTable,
  resourceEventsTable,
  type Conversation,
  type Message,
} from "@workspace/db";
import {
  AdminListConversationsQueryParams,
  AdminUpdateConversationBody,
  CreateConversationMessageBody,
  AdminListResourcesQueryParams,
  AdminCreateResourceBody,
  AdminUpdateResourceBody,
  type ConversationUser,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/supabaseAuth";
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

function serializeAdminConversation(conversation: Conversation, messages: Message[], user: ConversationUser) {
  return {
    id: conversation.id,
    status: conversation.status,
    tags: conversation.tags,
    preview: conversationPreview(messages),
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    user,
  };
}

// Profiles don't store email (Supabase Auth owns it), so every admin query
// that needs a user's identity joins profiles -> auth.users for just that
// column. Centralized here so the join and the null-coalesce (the column is
// nullable in Supabase's schema, though this app only ever does email auth)
// aren't repeated at each call site.
const conversationUserColumns = { id: profilesTable.id, name: profilesTable.name, email: authUsersTable.email };
function toConversationUser(user: { id: string; name: string; email: string | null }): ConversationUser {
  return { id: user.id, name: user.name, email: user.email ?? "" };
}

router.get("/admin/conversations", async (req, res) => {
  const { search, status, tag } = parseQuery(AdminListConversationsQueryParams, req.query);

  const conditions = [
    status ? eq(conversationsTable.status, status) : undefined,
    tag ? arrayContains(conversationsTable.tags, [tag]) : undefined,
    search ? or(ilike(profilesTable.name, `%${search}%`), ilike(authUsersTable.email, `%${search}%`)) : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> => condition != null);

  const rows = await db
    .select({ conversation: conversationsTable, user: conversationUserColumns })
    .from(conversationsTable)
    .innerJoin(profilesTable, eq(conversationsTable.userId, profilesTable.id))
    .innerJoin(authUsersTable, eq(profilesTable.id, authUsersTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    // Urgent conversations always surface first so nothing critical is missed
    // in the default view; within that, most recently active first.
    .orderBy(sql`case when ${conversationsTable.status} = 'urgent' then 0 else 1 end`, desc(conversationsTable.lastMessageAt));

  const withMessages = await Promise.all(
    rows.map(async ({ conversation, user }) => ({ conversation, user, messages: await loadMessages(conversation.id) })),
  );

  res
    .status(200)
    .json(withMessages.map(({ conversation, user, messages }) => serializeAdminConversation(conversation, messages, toConversationUser(user))));
});

router.get("/admin/conversations/:id", async (req, res) => {
  const [row] = await db
    .select({ conversation: conversationsTable, user: conversationUserColumns })
    .from(conversationsTable)
    .innerJoin(profilesTable, eq(conversationsTable.userId, profilesTable.id))
    .innerJoin(authUsersTable, eq(profilesTable.id, authUsersTable.id))
    .where(eq(conversationsTable.id, String(req.params.id)))
    .limit(1);

  if (!row) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }

  const messages = await loadMessages(row.conversation.id);
  res.status(200).json({
    ...serializeAdminConversation(row.conversation, messages, toConversationUser(row.user)),
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

  const [user] = await db
    .select(conversationUserColumns)
    .from(profilesTable)
    .innerJoin(authUsersTable, eq(profilesTable.id, authUsersTable.id))
    .where(eq(profilesTable.id, updated.userId))
    .limit(1);
  const messages = await loadMessages(updated.id);
  res.status(200).json(serializeAdminConversation(updated, messages, toConversationUser(user!)));
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

router.get("/admin/resources", async (req, res) => {
  const { search, topic, type } = parseQuery(AdminListResourcesQueryParams, req.query);

  const conditions = [
    topic ? eq(resourcesTable.topic, topic) : undefined,
    type ? eq(resourcesTable.type, type) : undefined,
    search ? or(ilike(resourcesTable.title, `%${search}%`), ilike(resourcesTable.description, `%${search}%`)) : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> => condition != null);

  const resources = await db
    .select()
    .from(resourcesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(resourcesTable.createdAt));

  res.status(200).json(resources);
});

router.post("/admin/resources", validateBody(AdminCreateResourceBody), async (req, res) => {
  const { title, description, type, topic, url, body } = req.body as {
    title: string;
    description: string;
    type: (typeof resourcesTable.$inferInsert)["type"];
    topic: (typeof resourcesTable.$inferInsert)["topic"];
    url?: string | null;
    body?: string | null;
  };

  const [resource] = await db
    .insert(resourcesTable)
    .values({ title, description, type, topic, url: url ?? null, body: body ?? null })
    .returning();

  res.status(201).json(resource);
});

router.patch("/admin/resources/:id", validateBody(AdminUpdateResourceBody), async (req, res) => {
  const updates = req.body as Partial<{
    title: string;
    description: string;
    type: (typeof resourcesTable.$inferInsert)["type"];
    topic: (typeof resourcesTable.$inferInsert)["topic"];
    url: string | null;
    body: string | null;
  }>;

  const [resource] = await db
    .update(resourcesTable)
    .set(updates)
    .where(eq(resourcesTable.id, String(req.params.id)))
    .returning();

  if (!resource) {
    res.status(404).json({ message: "Resource not found." });
    return;
  }

  res.status(200).json(resource);
});

router.delete("/admin/resources/:id", async (req, res) => {
  const [resource] = await db.delete(resourcesTable).where(eq(resourcesTable.id, String(req.params.id))).returning();

  if (!resource) {
    res.status(404).json({ message: "Resource not found." });
    return;
  }

  res.status(204).send();
});

router.get("/admin/analytics", async (req, res) => {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // "Users" here means profiles, which are created at first sign-in rather
  // than at Supabase signup (see getOrCreateProfile in lib/supabaseAuth.ts) —
  // close enough in practice (profile creation follows signup by one
  // request), but worth knowing if this and Supabase's own auth.users count
  // ever need to line up exactly.
  const [totalUsersRow] = await db.select({ count: sql<number>`count(*)::int` }).from(profilesTable);
  const [newRegistrationsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profilesTable)
    .where(gte(profilesTable.createdAt, sevenDaysAgo));

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
