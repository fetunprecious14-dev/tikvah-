import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../lib/supabaseAuth";

const router: IRouter = Router();

function serializeNotification(notification: typeof notificationsTable.$inferSelect) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    conversationId: notification.conversationId,
    read: notification.readAt != null,
    createdAt: notification.createdAt,
  };
}

router.get("/notifications", requireAuth, async (req, res) => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt));

  res.status(200).json(notifications.map(serializeNotification));
});

router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  const [notification] = await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.id, String(req.params.id)), eq(notificationsTable.userId, req.user!.id)))
    .returning();

  if (!notification) {
    res.status(404).json({ message: "Notification not found." });
    return;
  }

  res.status(200).json(serializeNotification(notification));
});

export default router;
