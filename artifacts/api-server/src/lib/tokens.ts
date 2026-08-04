import { createHash, randomBytes } from "node:crypto";

/** A random URL-safe token to hand to the client (session cookie, email link, etc). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only the hash of a token is ever stored, so a DB read can't leak usable tokens. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
