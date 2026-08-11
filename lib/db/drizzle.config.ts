import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // `schema/profiles.ts` declares a minimal stub for Supabase Auth's
  // `auth.users` table so `profiles.id` can carry a real FK to it — but that
  // stub only has an `id` column, while the real `auth.users` (owned by
  // Supabase's GoTrue, not us) has dozens more. Without this filter,
  // `drizzle-kit push` introspects `auth.users` in full and — seeing columns
  // in the DB that aren't in our one-column stub — would propose dropping
  // every column Supabase actually needs. Scoping push/generate to `public`
  // makes the stub a read-only FK target: never diffed, never altered.
  schemaFilter: ["public"],
});
