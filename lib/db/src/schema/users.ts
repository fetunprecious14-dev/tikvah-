import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const insertUserSchema = createInsertSchema(usersTable, {
  name: schema => schema.min(1, 'Please share your name.').max(120),
  email: schema => schema.email('Please enter a valid email address.'),
}).pick({ name: true, email: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
