import { eq } from 'drizzle-orm';

import { db } from './index';
import { account } from './schema';

export async function getAccountTokenInfo(accountId: string): Promise<{
  hasRefreshToken: boolean;
  accessTokenExpiresAt: Date | null;
  isExpired: boolean;
}> {
  const rows = await db
    .select({
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
    })
    .from(account)
    .where(eq(account.id, accountId))
    .limit(1);

  const row = rows[0];
  const accessTokenExpiresAt = row?.accessTokenExpiresAt ? new Date(row.accessTokenExpiresAt) : null;
  const isExpired = accessTokenExpiresAt ? accessTokenExpiresAt.getTime() <= Date.now() : false;

  return {
    hasRefreshToken: Boolean(row?.refreshToken),
    accessTokenExpiresAt,
    isExpired,
  };
}

