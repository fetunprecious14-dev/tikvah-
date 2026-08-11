import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { conversationsTable } from './conversations';
import { profilesTable } from './profiles';

export const notificationTypeEnum = pgEnum('notification_type', ['reply', 'resource', 'maintenance']);

export const notificationsTable = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profilesTable.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  conversationId: uuid('conversation_id').references(() => conversationsTable.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type Notification = typeof notificationsTable.$inferSelect;
