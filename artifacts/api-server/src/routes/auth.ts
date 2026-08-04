import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, emailVerificationTokensTable, passwordResetTokensTable, sessionsTable } from "@workspace/db";
import { RegisterUserBody, LoginUserBody, VerifyEmailBody, RequestPasswordResetBody, ResetPasswordBody } from "@workspace/api-zod";
import { sendEmail, verificationEmail, passwordResetEmail } from "@workspace/email";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { generateToken, hashToken } from "../lib/tokens";
import { createSession, setSessionCookie, clearSessionCookie, destroySessionByToken, requireAuth, SESSION_COOKIE } from "../lib/session";
import { validateBody } from "../lib/validate";
import { rateLimit } from "../lib/rateLimit";
import { serializeUser } from "../lib/serializers";
import { config } from "../lib/config";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

async function issueVerificationEmail(userId: string, name: string, email: string): Promise<void> {
  // Only one live verification token per user at a time.
  await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.userId, userId));

  const token = generateToken();
  await db.insert(emailVerificationTokensTable).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
  });

  const verifyUrl = `${config.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  try {
    await sendEmail(verificationEmail({ to: email, name, verifyUrl }));
  } catch (error) {
    // Registration/login should still succeed even if the email provider hiccups.
    logger.error({ error }, "Failed to send verification email");
  }
}

router.post("/auth/register", authRateLimit, validateBody(RegisterUserBody), async (req, res) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
  if (existing) {
    res.status(409).json({ message: "An account with that email already exists. Try logging in instead." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ name: name.trim(), email: normalizedEmail, passwordHash })
    .returning();

  await issueVerificationEmail(user.id, user.name, user.email);

  const token = await createSession(user.id);
  setSessionCookie(res, token);
  res.status(201).json(serializeUser(user));
});

router.post("/auth/login", authRateLimit, validateBody(LoginUserBody), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
  const invalidCredentialsMessage = "That email and password combination doesn't match our records.";

  if (!user) {
    res.status(401).json({ message: invalidCredentialsMessage });
    return;
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    res.status(401).json({ message: invalidCredentialsMessage });
    return;
  }

  const token = await createSession(user.id);
  setSessionCookie(res, token);
  res.status(200).json(serializeUser(user));
});

router.post("/auth/logout", async (req, res) => {
  const token = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  if (token) {
    await destroySessionByToken(token);
  }
  clearSessionCookie(res);
  res.status(204).send();
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.status(200).json(serializeUser(req.user!));
});

router.post("/auth/verify-email", validateBody(VerifyEmailBody), async (req, res) => {
  const { token } = req.body as { token: string };

  const [record] = await db
    .select()
    .from(emailVerificationTokensTable)
    .where(eq(emailVerificationTokensTable.tokenHash, hashToken(token)))
    .limit(1);

  if (!record || record.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ message: "This verification link is invalid or has expired. Request a new one from your dashboard." });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(usersTable.id, record.userId))
    .returning();

  await db.delete(emailVerificationTokensTable).where(eq(emailVerificationTokensTable.id, record.id));

  // Clicking a verification link proves email ownership — sign the user in if they
  // aren't already, so the link works even from a fresh browser/device.
  const existingSession = req.signedCookies?.[SESSION_COOKIE] as string | undefined;
  if (!existingSession) {
    const sessionToken = await createSession(user.id);
    setSessionCookie(res, sessionToken);
  }

  res.status(200).json(serializeUser(user));
});

router.post("/auth/resend-verification", requireAuth, async (req, res) => {
  const user = req.user!;
  if (user.emailVerifiedAt) {
    res.status(204).send();
    return;
  }
  await issueVerificationEmail(user.id, user.name, user.email);
  res.status(204).send();
});

router.post("/auth/request-password-reset", authRateLimit, validateBody(RequestPasswordResetBody), async (req, res) => {
  const { email } = req.body as { email: string };
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);

  // Always respond 204 whether or not the account exists, so this endpoint
  // can't be used to check which emails are registered.
  if (user) {
    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, user.id));

    const token = generateToken();
    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${config.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await sendEmail(passwordResetEmail({ to: user.email, name: user.name, resetUrl }));
    } catch (error) {
      logger.error({ error }, "Failed to send password reset email");
    }
  }

  res.status(204).send();
});

router.post("/auth/reset-password", authRateLimit, validateBody(ResetPasswordBody), async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };

  const [record] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.tokenHash, hashToken(token)))
    .limit(1);

  if (!record || record.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ message: "This reset link is invalid or has expired. Request a new one." });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, record.userId)).returning();

  await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, record.userId));
  // A password reset invalidates every existing session as a security measure.
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, record.userId));

  const sessionToken = await createSession(user.id);
  setSessionCookie(res, sessionToken);
  res.status(200).json(serializeUser(user));
});

export default router;
