import type { Request, Response, NextFunction } from "express";

/**
 * A small in-memory, per-IP sliding-window rate limiter. Good enough to blunt
 * casual abuse on a single-instance deployment; a real production deployment
 * with multiple instances should move this to a shared store (e.g. Redis).
 */
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const hits = new Map<string, number[]>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const windowStart = now - options.windowMs;

    const existing = (hits.get(key) ?? []).filter(timestamp => timestamp > windowStart);
    existing.push(now);
    hits.set(key, existing);

    if (existing.length > options.max) {
      res.status(429).json({ message: options.message ?? "Too many requests. Please slow down and try again shortly." });
      return;
    }

    next();
  };
}
