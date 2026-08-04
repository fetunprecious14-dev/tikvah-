import type { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { config } from "./config";
import { logger } from "./logger";

/** Records a hit for `key` and returns the number of hits within the current window. */
interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<number>;
}

/**
 * Per-process sliding-window counter. Fine for a single-instance deployment;
 * resets on restart and doesn't coordinate across instances — see RedisStore.
 */
class InMemoryStore implements RateLimitStore {
  private hits = new Map<string, number[]>();

  async hit(key: string, windowMs: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const existing = (this.hits.get(key) ?? []).filter(timestamp => timestamp > windowStart);
    existing.push(now);
    this.hits.set(key, existing);
    return existing.length;
  }
}

/**
 * Shared fixed-window counter backed by Redis, so rate limits hold across
 * multiple API server instances. A fixed window (INCR + PEXPIRE on first hit)
 * is a slightly coarser approximation than the in-memory sliding window, but
 * it's the standard trade-off for a single round-trip, race-safe counter.
 */
class RedisStore implements RateLimitStore {
  private redis: Redis;

  constructor(url: string) {
    this.redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
    this.redis.on("error", error => logger.error({ error }, "Redis rate-limit store connection error"));
  }

  async hit(key: string, windowMs: number): Promise<number> {
    const redisKey = `ratelimit:${key}`;
    const count = await this.redis.incr(redisKey);
    if (count === 1) {
      await this.redis.pexpire(redisKey, windowMs);
    }
    return count;
  }
}

let sharedStore: RateLimitStore | null = null;

function getStore(): RateLimitStore {
  if (!sharedStore) {
    sharedStore = config.redisUrl ? new RedisStore(config.redisUrl) : new InMemoryStore();
  }
  return sharedStore;
}

/**
 * A small per-IP rate limiter. Uses a shared Redis-backed store when
 * REDIS_URL is set (safe for multi-instance deployments), otherwise falls
 * back to an in-process store — good enough to blunt casual abuse on a
 * single-instance deployment.
 */
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const store = getStore();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const key = `${req.baseUrl}${req.path}:${req.ip ?? "unknown"}`;

    store
      .hit(key, options.windowMs)
      .then(count => {
        if (count > options.max) {
          res.status(429).json({ message: options.message ?? "Too many requests. Please slow down and try again shortly." });
          return;
        }
        next();
      })
      .catch(error => {
        // Fail open — a rate-limit store outage shouldn't take the whole API down.
        logger.error({ error }, "Rate limit store error — allowing the request through");
        next();
      });
  };
}
