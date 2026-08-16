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

/**
 * Base URL of the frontend, used to build links inside emails.
 *
 * The frontend and this API are deployed as a single Vercel Project on a single
 * domain, so the deployment's own URL is the right answer there and `APP_URL`
 * only needs setting for a custom domain (or a non-Vercel host).
 * `VERCEL_PROJECT_PRODUCTION_URL` is preferred over `VERCEL_URL` because the
 * latter is the unique per-deployment URL — using it would bake a
 * deployment-specific host into verification and password-reset links, which
 * then outlive that deployment. `VERCEL_URL` is still the sensible fallback on
 * preview deployments, where no production domain is assigned yet.
 */
function resolveAppUrl(): string {
  const explicitUrl = process.env.APP_URL;
  if (explicitUrl) return explicitUrl.replace(/\/+$/, "");

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:5173";
}

export const config = {
  cookieSecret: requireInProduction(process.env.COOKIE_SECRET, "COOKIE_SECRET", "dev-only-insecure-cookie-secret"),
  /** Base URL of the frontend, used to build links inside emails. Never has a trailing slash. */
  appUrl: resolveAppUrl(),
  /** Where urgent-flag alert emails are sent; alerts are skipped (logged) when unset. */
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL ?? null,
  /** Where urgent-flag alert SMS texts are sent (E.164 format); skipped (logged) when unset. */
  adminAlertPhone: process.env.ADMIN_ALERT_PHONE ?? null,
  /** One trusted account promoted after it verifies ownership of this email. */
  initialAdminEmail: process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase() || null,
  /** Shared rate-limit store for multi-instance deployments; falls back to in-process memory when unset. */
  redisUrl: process.env.REDIS_URL ?? null,
};
