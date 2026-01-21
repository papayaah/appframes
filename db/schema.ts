/**
 * Database schema
 *
 * Re-exports Better Auth tables from the package.
 * Add app-specific tables below.
 */

// Better Auth standard tables (user, account, session, verification + relations)
export {
  user,
  account,
  session,
  verification,
  userRelations,
  accountRelations,
  sessionRelations,
  betterAuthSchema,
} from '@reactkits.dev/better-auth-connect/server/drizzle';

// App-specific tables can be added here:
// import { pgTable, text } from 'drizzle-orm/pg-core';
// export const myTable = pgTable('my_table', { ... });
