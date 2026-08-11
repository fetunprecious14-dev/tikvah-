/**
 * Required, no dev fallback — unlike `COOKIE_SECRET` before it, there's no
 * insecure-but-working default for "which Supabase project is this". Fail
 * fast with a clear message rather than let every request 401 mysteriously.
 */
function requireEnv(value: string | undefined, name: string): string {
  if (value) return value;
  throw new Error(`${name} environment variable is required but was not provided.`);
}

/**
 * Base URL of the frontend, used to build links inside emails.
 *
 * The frontend and this API are deployed as a single Vercel Project on a single
 * domain, so the deployment's own URL is the right answer there and `APP_URL`
 * only needs setting for a custom domain (or a non-Vercel host).
 * `VERCEL_PROJECT_PRODUCTION_URL` is preferred over `VERCEL_URL` because the
 * latter is the unique per-deployment URL — using it would bake a
 * deployment-specific host into reply-notification and urgent-alert links,
 * which then outlive that deployment. `VERCEL_URL` is still the sensible
 * fallback on preview deployments, where no production domain is assigned yet.
 */
function resolveAppUrl(): string {
  const explicitUrl = process.env.APP_URL;
  if (explicitUrl) return explicitUrl.replace(/\/+$/, "");

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:5173";
}

export const config = {
  /**
   * Used to verify the `Authorization: Bearer <token>` header Supabase Auth
   * issues to the frontend — see `lib/supabaseAuth.ts`. The anon/publishable
   * key is safe here (it's the same key the browser holds); this never uses
   * the service_role key, which must never run anywhere it could reach a
   * browser.
   */
  supabaseUrl: requireEnv(process.env.SUPABASE_URL, "SUPABASE_URL"),
  supabaseAnonKey: requireEnv(
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY,
    "SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY)",
  ),
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
