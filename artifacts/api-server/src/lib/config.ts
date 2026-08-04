import { logger } from "./logger";

const isProduction = process.env.NODE_ENV === "production";

function requireInProduction(value: string | undefined, name: string, devFallback: string): string {
  if (value) return value;
  if (isProduction) {
    throw new Error(`${name} environment variable is required in production but was not provided.`);
  }
  logger.warn(`${name} is not set — using an insecure development fallback. Set it before deploying.`);
  return devFallback;
}

export const config = {
  cookieSecret: requireInProduction(process.env.COOKIE_SECRET, "COOKIE_SECRET", "dev-only-insecure-cookie-secret"),
  /** Base URL of the frontend, used to build links inside emails. */
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  /** Where urgent-flag alert emails are sent; alerts are skipped (logged) when unset. */
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL ?? null,
  /** Where urgent-flag alert SMS texts are sent (E.164 format); skipped (logged) when unset. */
  adminAlertPhone: process.env.ADMIN_ALERT_PHONE ?? null,
  /** Shared rate-limit store for multi-instance deployments; falls back to in-process memory when unset. */
  redisUrl: process.env.REDIS_URL ?? null,
};
