import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config (Postgres)
 *
 * Usage (example):
 * - npx drizzle-kit generate
 * - npx drizzle-kit migrate
 */
export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

