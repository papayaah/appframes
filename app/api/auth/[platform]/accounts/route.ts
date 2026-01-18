import {
  createPlatformAccountsRouteHandlers,
  type PlatformAccountsHandlersOptions,
} from '@reactkits.dev/better-auth-connect/server/nextjs';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { account } from '@/db/schema';
import { getAccountTokenInfo } from '@/db/helpers';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

const handlers = createPlatformAccountsRouteHandlers({
  auth,
  getAccountTokenInfo,
  deleteAccount: async ({
    accountId,
    userId,
    providerId,
  }: Parameters<PlatformAccountsHandlersOptions['deleteAccount']>[0]) => {
    await db
      .delete(account)
      .where(and(eq(account.id, accountId), eq(account.userId, userId), eq(account.providerId, providerId)));
  },
});

export const { GET, DELETE } = handlers;

