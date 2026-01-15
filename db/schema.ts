import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * Better Auth core tables (Postgres / Drizzle)
 *
 * We keep these table names singular (`user`, `account`, `session`, `verification`)
 * to match Better Auth conventions and the templates in `better-auth-connect`.
 */

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email'),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    image: text('image'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex('user_email_unique').on(t.email),
  })
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    // Better Auth / OAuth identity
    providerId: text('provider_id').notNull(),
    accountId: text('account_id').notNull(),

    // Token fields (used by better-auth-connect "accounts" UI)
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'date' }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'date' }),
    scope: text('scope'),

    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    userProviderIdx: uniqueIndex('account_user_provider_unique').on(t.userId, t.providerId, t.accountId),
    providerIdx: index('account_provider_idx').on(t.providerId),
  })
);

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    /**
     * Better Auth uses a session "token" to identify the session cookie/server session.
     * Some setups call this `token`, others `sessionToken`.
     * We keep `token` to match Better Auth defaults.
     */
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    tokenUnique: uniqueIndex('session_token_unique').on(t.token),
    userIdx: index('session_user_idx').on(t.userId),
  })
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => ({
    identifierIdx: index('verification_identifier_idx').on(t.identifier),
    tokenUnique: uniqueIndex('verification_token_unique').on(t.token),
  })
);

// Relations (optional but helpful)
export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

