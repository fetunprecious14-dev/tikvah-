import type { User } from "@workspace/db/schema";

declare global {
  namespace Express {
    interface Request {
      /** Set by the `requireAuth` middleware once a valid session is found. */
      user?: User;
    }
  }
}

export {};
