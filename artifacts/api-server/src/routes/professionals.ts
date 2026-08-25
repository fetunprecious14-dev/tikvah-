import { Router, type IRouter } from "express";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db, professionalsTable } from "@workspace/db";
import { ListProfessionalsQueryParams } from "@workspace/api-zod";
import { parseQuery } from "../lib/validate";

const router: IRouter = Router();

router.get("/professionals", async (req, res) => {
  const { search } = parseQuery(ListProfessionalsQueryParams, req.query);

  const searchCondition = search
    ? or(
        ilike(professionalsTable.name, `%${search}%`),
        ilike(professionalsTable.profession, `%${search}%`),
        ilike(professionalsTable.bio, `%${search}%`),
        ilike(professionalsTable.location, `%${search}%`),
      )
    : undefined;

  const professionals = await db
    .select()
    .from(professionalsTable)
    .where(and(eq(professionalsTable.isPublished, true), searchCondition))
    .orderBy(asc(professionalsTable.displayOrder), asc(professionalsTable.name));

  res.status(200).json(professionals);
});

export default router;
