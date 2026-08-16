import type { Request, Response, NextFunction } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db, sessionsTable, usersTable, type User } from "@workspace/db";
import { generateToken, hashToken } from "./tokens";

export const SESSION_COOKIE = "tikvah_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const isProduction = process.env.NODE_ENV === "production";

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  await db.insert(sessionsTable).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export async function destroySessionByToken(token: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.tokenHash, hashToken(token)));
}

export async function getUserFromRequest(req: Request): Promise<User | null> {
  // The cookie contains an opaque, server-generated random token. We only
  // trust it after hashing it and finding a live row in the sessions table, so
  // an additional cookie signature adds no authorization guarantee. Keeping
  // it unsigned also avoids depending on Express' request-bound signing state
  // in serverless response adapters.
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) return null;

  const [row] = await db
    .select({ user: usersTable })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(and(eq(sessionsTable.tokenHash, hashToken(token)), gt(sessionsTable.expiresAt, new Date())))
    .limit(1);

  return row?.user ?? null;
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
