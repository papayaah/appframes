import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { wrapPostgresForBetterAuth } from '@reactkits.dev/better-auth-connect/server/drizzle';

import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __appframes_db_client: postgres.Sql | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Wrap postgres client for Better Auth compatibility (Date serialization)
const createClient = () => wrapPostgresForBetterAuth(
  postgres(connectionString, { max: 10 })
);

export const dbClient = globalThis.__appframes_db_client ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__appframes_db_client = dbClient;
}

export const db = drizzle(dbClient, { schema });

export type DB = typeof db;

