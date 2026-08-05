import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * Serverless platforms can spin up many concurrent function instances, each
 * importing this module fresh and creating its own pool — with pg's default
 * max of 10 connections per pool, that adds up fast against a Postgres
 * instance's connection limit. Vercel sets `VERCEL=1` in its runtime (Lambda
 * sets `AWS_LAMBDA_FUNCTION_NAME`), so we detect that and default to a single
 * connection per instance there. Override explicitly with DATABASE_POOL_MAX
 * (e.g. a higher value makes sense for a traditional long-running server).
 */
function resolvePoolMax(): number {
  const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME != null;
  const defaultMax = isServerless ? 1 : 10;

  const override = process.env.DATABASE_POOL_MAX;
  if (!override) return defaultMax;

  const parsed = Number(override);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultMax;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: resolvePoolMax(),
  // Release idle clients quickly rather than holding connections open —
  // serverless instances can be frozen/killed at any time, so there's little
  // benefit to a long idle keep-alive, and providers' pooled (PgBouncer-style)
  // endpoints often enforce their own idle limits anyway.
  idleTimeoutMillis: 10_000,
  // Fail fast instead of hanging indefinitely if every connection is busy —
  // better to surface a clear error than let a request queue forever.
  connectionTimeoutMillis: 5_000,
});

// pg emits 'error' on an idle client when its underlying connection drops
// (e.g. the provider recycles it). Left unhandled, Node treats that as an
// unhandled error and crashes the whole process — one dropped idle
// connection shouldn't take the app down.
pool.on("error", error => {
  console.error("[db] Unexpected error on an idle Postgres client:", error);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
