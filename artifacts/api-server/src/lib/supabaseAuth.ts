import type { Request, Response, NextFunction } from "express";
import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db, profilesTable, type Profile } from "@workspace/db";
import { config } from "./config";

/**
 * Server-side client used only to validate bearer tokens the frontend sends
 * (`supabase.auth.getUser(token)`), never to manage a session of its own —
 * hence every session-related option disabled below. Built with the
 * anon/publishable key, the same one the browser holds; this file must never
 * touch the service_role key.
 */
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

/** The normalized shape every route sees as `req.user` — see `types/express.d.ts`. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Profile["role"];
  createdAt: Date;
  emailVerified: boolean;
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

/**
 * Loads the app-owned profile for a Supabase Auth user, creating it on first
 * sight. This is the only place a `profiles` row is created — deliberately
 * *not* a database trigger, so profile creation stays visible in application
 * code (see replit.md).
 *
 * Called on every authenticated request, not just right after registration:
 * Supabase may not return a session immediately after `signUp` (email
 * confirmation pending), so the frontend's explicit `POST /auth/profile` call
 * can't always land right away. Making this idempotent and request-path-wide
 * means a user is never stuck without a profile because that one call was
 * missed — the first authenticated request after they do have a session
 * repairs it.
 */
async function getOrCreateProfile(supabaseUser: SupabaseUser, fallbackName?: string): Promise<Profile> {
  const [existing] = await db.select().from(profilesTable).where(eq(profilesTable.id, supabaseUser.id)).limit(1);
  if (existing) return existing;

  const metadataName = supabaseUser.user_metadata?.name;
  const name = fallbackName?.trim() || (typeof metadataName === "string" ? metadataName.trim() : "") || "Tikvah user";

  const [created] = await db.insert(profilesTable).values({ id: supabaseUser.id, name }).onConflictDoNothing().returning();
  if (created) return created;

  // Lost a race with another concurrent request creating the same profile.
  const [afterRace] = await db.select().from(profilesTable).where(eq(profilesTable.id, supabaseUser.id)).limit(1);
  if (!afterRace) throw new Error(`Failed to create or load a profile for Supabase user ${supabaseUser.id}`);
  return afterRace;
}

function toAuthUser(supabaseUser: SupabaseUser, profile: Profile): AuthUser {
  return {
    id: profile.id,
    email: supabaseUser.email ?? "",
    name: profile.name,
    role: profile.role,
    createdAt: profile.createdAt,
    emailVerified: supabaseUser.email_confirmed_at != null,
  };
}

/**
 * Validates the bearer token server-side against Supabase Auth (a network
 * call to GoTrue's `/user` endpoint — this is deliberate: verifying against
 * Supabase rather than decoding the JWT locally means a revoked/signed-out
 * token is rejected immediately, not just once it expires) and returns the
 * normalized user, or `null` if there's no token or it doesn't validate.
 */
export async function getUserFromRequest(req: Request, fallbackName?: string): Promise<AuthUser | null> {
  const token = bearerToken(req);
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const profile = await getOrCreateProfile(data.user, fallbackName);
  return toAuthUser(data.user, profile);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ message: "Please sign in to continue." });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: "Please sign in to continue." });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ message: "This area is only available to the Tikvah team." });
    return;
  }
  next();
}
