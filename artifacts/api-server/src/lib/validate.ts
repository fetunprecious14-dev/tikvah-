import type { NextFunction, Request, Response } from "express";
import type { z, ZodTypeAny } from "zod";

/** Validates req.body against a generated Zod schema (see @workspace/api-zod), 400s on failure. */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: result.error.issues[0]?.message ?? "Invalid request." });
      return;
    }
    req.body = result.data as z.infer<T>;
    next();
  };
}

/** Parses req.query against a generated Zod schema, falling back to an empty object on failure. */
export function parseQuery<T extends ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query);
  return result.success ? result.data : ({} as z.infer<T>);
}
