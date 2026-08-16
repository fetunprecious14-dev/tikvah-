// Promotes an existing user to the admin role by email.
// Usage: pnpm --filter @workspace/scripts run promote-admin -- someone@example.com

import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: pnpm --filter @workspace/scripts run promote-admin -- <email>");
  process.exit(1);
}

const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

if (!user) {
  console.error(`No account found for ${email}. They need to register on the site first.`);
  process.exit(1);
}

if (user.role === "admin") {
  console.log(`${email} is already an admin.`);
  process.exit(0);
}

await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id));
console.log(`${email} is now a Tikvah admin.`);
process.exit(0);
