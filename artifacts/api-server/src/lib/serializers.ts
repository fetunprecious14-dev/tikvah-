import type { AuthUser } from "./supabaseAuth";
import type { User as ApiUser } from "@workspace/api-zod";

/** `req.user` (see `lib/supabaseAuth.ts`) is already shaped like the API's `User` — this is just the seam between them. */
export function serializeUser(user: AuthUser): ApiUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}
