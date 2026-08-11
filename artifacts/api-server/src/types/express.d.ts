import type { AuthUser } from "../lib/supabaseAuth";

declare global {
  namespace Express {
    interface Request {
      /** Set by the `requireAuth` middleware once a valid Supabase Auth token is found. */
      user?: AuthUser;
    }
  }
}

export {};
