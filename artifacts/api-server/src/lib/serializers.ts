import type { User } from "@workspace/db";
import type { User as ApiUser } from "@workspace/api-zod";

export function serializeUser(user: User): ApiUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerifiedAt != null,
    createdAt: user.createdAt,
  };
}
