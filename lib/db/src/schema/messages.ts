import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { conversationsTable } from './conversations';
import { usersTable } from './users';

export const senderTypeEnum = pgEnum('sender_type', ['user', 'admin']);

export const messagesTable = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversationsTable.id, { onDelete: 'cascade' }),
  senderType: senderTypeEnum('sender_type').notNull(),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => usersTable.id),
  body: text('body').notNull(),
  riskCategories: text('risk_categories').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable, {
  body: schema => schema.trim().min(1, 'Please write something before sending.').max(20000),
}).pick({ body: true });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
