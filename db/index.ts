import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __appframes_db_client: postgres.Sql | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // We throw at import-time because server routes need a DB for auth sessions.
  // (If you want to boot the app without DB, we can lazily init, but Better Auth routes will fail anyway.)
  throw new Error('DATABASE_URL is not set');
}

export const dbClient = globalThis.__appframes_db_client ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__appframes_db_client = dbClient;
}

export const db = drizzle(dbClient, { schema });

export type DB = typeof db;

