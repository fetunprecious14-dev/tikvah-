import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { profilesTable } from './profiles';

export const resourceTypeEnum = pgEnum('resource_type', [
  'article',
  'book',
  'video',
  'podcast',
  'verse',
  'exercise',
  'prompt',
  'tip',
]);

export const resourceTopicEnum = pgEnum('resource_topic', [
  'anxiety',
  'grief',
  'purpose',
  'relationships',
  'depression',
  'stress',
  'faith',
  'healing',
  'self-worth',
]);

export const resourcesTable = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: resourceTypeEnum('type').notNull(),
  topic: resourceTopicEnum('topic').notNull(),
  url: text('url'),
  body: text('body'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const resourceEventsTable = pgTable('resource_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resourcesTable.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => profilesTable.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type Resource = typeof resourcesTable.$inferSelect;
