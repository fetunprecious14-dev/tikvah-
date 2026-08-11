import { Router, type IRouter } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, resourcesTable, resourceEventsTable } from "@workspace/db";
import { ListResourcesQueryParams } from "@workspace/api-zod";
import { parseQuery } from "../lib/validate";
import { getUserFromRequest } from "../lib/supabaseAuth";

const router: IRouter = Router();

router.get("/resources", async (req, res) => {
  const { search, topic, type } = parseQuery(ListResourcesQueryParams, req.query);

  const conditions = [
    topic ? eq(resourcesTable.topic, topic) : undefined,
    type ? eq(resourcesTable.type, type) : undefined,
    search ? or(ilike(resourcesTable.title, `%${search}%`), ilike(resourcesTable.description, `%${search}%`)) : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> => condition != null);

  const resources = await db
    .select()
    .from(resourcesTable)
    .where(conditions.length ? and(...conditions) : undefined);

  res.status(200).json(resources);
});

router.post("/resources/:id/view", async (req, res) => {
  const [resource] = await db.select({ id: resourcesTable.id }).from(resourcesTable).where(eq(resourcesTable.id, String(req.params.id))).limit(1);
  if (!resource) {
    res.status(404).json({ message: "Resource not found." });
    return;
  }

  // Viewing a resource doesn't require sign-in, but we attribute the event when we can.
  const user = await getUserFromRequest(req);
  await db.insert(resourceEventsTable).values({ resourceId: resource.id, userId: user?.id ?? null });

  res.status(204).send();
});

export default router;
