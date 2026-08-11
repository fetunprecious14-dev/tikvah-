// Promotes an existing user to the admin role by email.
// Usage: pnpm --filter @workspace/scripts run promote-admin -- someone@example.com
//
// "User" now means a Supabase Auth account. Their email lives in auth.users
// (owned by Supabase, not this app — see lib/db/src/schema/profiles.ts), so
// this looks the account up there first, then upserts the app-owned
// `profiles` row. The upsert matters because a profile may not exist yet —
// it's normally created lazily on first authenticated request (see
// getOrCreateProfile in artifacts/api-server/src/lib/supabaseAuth.ts) — so
// promoting a brand-new account before its first login still works.

import { eq, sql } from "drizzle-orm";
import { db, authUsersTable, profilesTable } from "@workspace/db";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: pnpm --filter @workspace/scripts run promote-admin -- <email>");
  process.exit(1);
}

const [authUser] = await db
  .select({ id: authUsersTable.id, name: sql<string | null>`raw_user_meta_data ->> 'name'` })
  .from(authUsersTable)
  .where(eq(authUsersTable.email, email))
  .limit(1);

if (!authUser) {
  console.error(`No Supabase Auth account found for ${email}. They need to register on the site first.`);
  process.exit(1);
}

const [existingProfile] = await db.select().from(profilesTable).where(eq(profilesTable.id, authUser.id)).limit(1);

if (existingProfile?.role === "admin") {
  console.log(`${email} is already an admin.`);
  process.exit(0);
}

await db
  .insert(profilesTable)
  .values({ id: authUser.id, name: authUser.name ?? email, role: "admin" })
  .onConflictDoUpdate({ target: profilesTable.id, set: { role: "admin" } });

console.log(`${email} is now a Tikvah admin.`);
process.exit(0);
