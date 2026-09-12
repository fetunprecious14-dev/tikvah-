import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

/**
 * One row per browser/device the user has enabled push notifications on (a
 * user can have several — phone, laptop, etc). `endpoint` uniquely identifies
 * the push service subscription and is how we dedupe re-subscribes.
 */
export const pushSubscriptionsTable = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;
