import { pgEnum, pgSchema, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

/**
 * Minimal stub for Supabase Auth's `auth.users` table, declared only so
 * `profilesTable.id` can carry a real foreign key to it. Supabase owns this
 * table entirely (via GoTrue) — never migrate, alter, or write to it from
 * here. Only the columns actually referenced elsewhere are declared.
 */
const authSchema = pgSchema('auth');
export const authUsersTable = authSchema.table('users', {
  id: uuid('id').primaryKey(),
  // Read-only, for looking up a user's email to send them product email
  // (reply notifications, etc.) — `profiles` deliberately doesn't duplicate
  // it. Nullable to match the real column (Supabase allows phone-only auth,
  // even though this app only ever uses email/password).
  email: text('email'),
});

/**
 * Tikvah-specific fields for a Supabase Auth user. One row per `auth.users`
 * row, created lazily (see `getOrCreateProfile` in `lib/supabaseAuth.ts` on
 * the API server) rather than via a database trigger, so profile creation
 * stays visible in application code instead of hidden in the database.
 *
 * Deliberately excludes anything Supabase Auth already owns — email,
 * password, email-confirmation state all live in `auth.users` and are read
 * from the verified JWT, not duplicated here.
 */
export const profilesTable = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => authUsersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type Profile = typeof profilesTable.$inferSelect;
