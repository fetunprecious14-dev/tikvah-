import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, conversationsTable, type Conversation, type Message } from "@workspace/db";
import { CreateConversationBody, CreateConversationMessageBody, ListConversationsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/supabaseAuth";
import { validateBody, parseQuery } from "../lib/validate";
import { rateLimit } from "../lib/rateLimit";
import { appendMessage, loadMessages, conversationPreview } from "../lib/conversations";

const router: IRouter = Router();

const TIKVAH_TEAM_LABEL = "Tikvah team";

const messageRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "You're sending messages a little too quickly. Please slow down.",
});

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

function serializeConversation(conversation: Conversation, messages: Message[]) {
  return {
    id: conversation.id,
    status: conversation.status,
    tags: conversation.tags,
    preview: conversationPreview(messages),
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
  };
}

router.get("/conversations", requireAuth, async (req, res) => {
  const { search } = parseQuery(ListConversationsQueryParams, req.query);

  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.userId, req.user!.id))
    .orderBy(desc(conversationsTable.lastMessageAt));

  const withMessages = await Promise.all(
    conversations.map(async conversation => ({ conversation, messages: await loadMessages(conversation.id) })),
  );

  const filtered = search
    ? withMessages.filter(({ messages }) => messages.some(message => message.body.toLowerCase().includes(search.toLowerCase())))
    : withMessages;

  res.status(200).json(filtered.map(({ conversation, messages }) => serializeConversation(conversation, messages)));
});

router.post("/conversations", requireAuth, messageRateLimit, validateBody(CreateConversationBody), async (req, res) => {
  const { body } = req.body as { body: string };
  const user = req.user!;

  const [conversation] = await db.insert(conversationsTable).values({ userId: user.id }).returning();
  await appendMessage({ conversation, senderType: "user", senderId: user.id, body });

  const messages = await loadMessages(conversation.id);
  const [refreshed] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, conversation.id)).limit(1);

  res.status(201).json({
    ...serializeConversation(refreshed, messages),
    messages: messages.map(message => serializeMessage(message, user.name)),
  });
});

router.get("/conversations/:id", requireAuth, async (req, res) => {
  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, String(req.params.id)), eq(conversationsTable.userId, req.user!.id)))
    .limit(1);

  if (!conversation) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }

  const messages = await loadMessages(conversation.id);
  res.status(200).json({
    ...serializeConversation(conversation, messages),
    messages: messages.map(message => serializeMessage(message, req.user!.name)),
  });
});

router.post("/conversations/:id/messages", requireAuth, messageRateLimit, validateBody(CreateConversationMessageBody), async (req, res) => {
  const { body } = req.body as { body: string };
  const user = req.user!;

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, String(req.params.id)), eq(conversationsTable.userId, user.id)))
    .limit(1);

  if (!conversation) {
    res.status(404).json({ message: "Conversation not found." });
    return;
  }

  const message = await appendMessage({ conversation, senderType: "user", senderId: user.id, body });
  res.status(201).json(serializeMessage(message, user.name));
});

export default router;
