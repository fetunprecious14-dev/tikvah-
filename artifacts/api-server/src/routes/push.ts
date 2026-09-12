import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { SubscribeToPushBody, UnsubscribeFromPushBody } from "@workspace/api-zod";
import { getVapidPublicKey } from "@workspace/webpush";
import { requireAuth } from "../lib/session";
import { validateBody } from "../lib/validate";

const router: IRouter = Router();

router.get("/push/vapid-public-key", (_req, res) => {
  res.status(200).json({ publicKey: getVapidPublicKey() });
});

router.post("/push/subscribe", requireAuth, validateBody(SubscribeToPushBody), async (req, res) => {
  const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };

  // A given browser subscription (endpoint) always belongs to one device, so a
  // re-subscribe (e.g. after the user logs out and a different account logs
  // in on the same device) should move it to the new owner rather than error.
  await db
    .insert(pushSubscriptionsTable)
    .values({ userId: req.user!.id, endpoint, p256dh: keys.p256dh, auth: keys.auth })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { userId: req.user!.id, p256dh: keys.p256dh, auth: keys.auth },
    });

  res.status(204).send();
});

router.post("/push/unsubscribe", requireAuth, validateBody(UnsubscribeFromPushBody), async (req, res) => {
  const { endpoint } = req.body as { endpoint: string };

  await db
    .delete(pushSubscriptionsTable)
    .where(and(eq(pushSubscriptionsTable.endpoint, endpoint), eq(pushSubscriptionsTable.userId, req.user!.id)));

  res.status(204).send();
});

export default router;
