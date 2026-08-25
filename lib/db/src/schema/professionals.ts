import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const professionalsTable = pgTable('professionals', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  profession: text('profession').notNull(),
  credentials: text('credentials'),
  bio: text('bio').notNull(),
  specialties: text('specialties').array().notNull().default([]),
  languages: text('languages').array().notNull().default([]),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  location: text('location'),
  offersRemote: boolean('offers_remote').notNull().default(false),
  offersInPerson: boolean('offers_in_person').notNull().default(false),
  imageUrl: text('image_url'),
  isPublished: boolean('is_published').notNull().default(false),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type Professional = typeof professionalsTable.$inferSelect;
