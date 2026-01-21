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
  // Handle timestamp string from PostgreSQL (may be in format 'YYYY-MM-DD HH:mm:ss' or ISO string)
  let accessTokenExpiresAt: Date | null = null;
  if (row?.accessTokenExpiresAt) {
    const expiresStr = String(row.accessTokenExpiresAt);
    // If it's already an ISO string (has 'T' or ends with 'Z'), parse directly
    // Otherwise, treat PostgreSQL timestamp as UTC (since it's stored without timezone)
    if (expiresStr.includes('T') || expiresStr.endsWith('Z')) {
      accessTokenExpiresAt = new Date(expiresStr);
    } else {
      // PostgreSQL timestamp without timezone - append 'Z' to treat as UTC
      accessTokenExpiresAt = new Date(expiresStr + 'Z');
    }
  }
  const isExpired = accessTokenExpiresAt ? accessTokenExpiresAt.getTime() <= Date.now() : false;

  return {
    hasRefreshToken: Boolean(row?.refreshToken),
    accessTokenExpiresAt,
    isExpired,
  };
}

