import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './users';

export const conversationStatusEnum = pgEnum('conversation_status', [
  'awaiting_reply',
  'responded',
  'urgent',
  'archived',
]);

export const conversationsTable = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  status: conversationStatusEnum('status').notNull().default('awaiting_reply'),
  tags: text('tags')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Conversation = typeof conversationsTable.$inferSelect;
