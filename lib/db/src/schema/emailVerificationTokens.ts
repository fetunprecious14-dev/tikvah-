import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

export const emailVerificationTokensTable = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type EmailVerificationToken = typeof emailVerificationTokensTable.$inferSelect;
