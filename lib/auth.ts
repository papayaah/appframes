import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/db';
import { account, session, user, verification } from '@/db/schema';

/**
 * Better Auth instance (server)
 *
 * Notes:
 * - This powers `/api/auth/*` via `toNextJsHandler(auth)`.
 * - We keep the app usable without signing in; auth is only required for sync later.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      account,
      session,
      verification,
    },
  }),

  account: {
    accountLinking: {
      enabled: true,
      // Auto-link accounts with same verified email from these providers
      trustedProviders: ['google'],
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Helps ensure refresh tokens are issued when needed.
      accessType: 'offline',
      prompt: 'select_account consent',
    },
  },
});

export type Session = typeof auth.$Infer.Session;

