import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env files explicitly (drizzle-kit doesn't auto-load them like Next.js)
// Try .env.local first (takes precedence), then fall back to .env
const envLocalPath = resolve(__dirname, '.env.local');
const envPath = resolve(__dirname, '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  config({ path: envPath });
}

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

