import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { RegisterProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/supabaseAuth";
import { validateBody } from "../lib/validate";
import { serializeUser } from "../lib/serializers";

const router: IRouter = Router();

// Signup, login, logout, email verification, and password reset are all
// handled client-side by Supabase Auth now — see replit.md. Everything left
// here is Tikvah's own profile data layered on top of a Supabase Auth user.

router.post("/auth/profile", requireAuth, validateBody(RegisterProfileBody), async (req, res) => {
  const { name } = req.body as { name: string };
  const user = req.user!;

  // requireAuth already created a profile row if one didn't exist (see
  // getOrCreateProfile in lib/supabaseAuth.ts) — this call's job is just to
  // set the real name from the registration form, so it's a plain update
  // rather than an insert. Idempotent either way: calling this again just
  // re-sets the same name.
  await db.update(profilesTable).set({ name: name.trim() }).where(eq(profilesTable.id, user.id));

  res.status(200).json(serializeUser({ ...user, name: name.trim() }));
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.status(200).json(serializeUser(req.user!));
});

export default router;
