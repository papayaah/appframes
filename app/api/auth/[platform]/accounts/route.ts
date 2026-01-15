import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getAccountTokenInfo } from '@/db/helpers';

export const runtime = 'nodejs';

type PlatformParam = 'reddit' | 'x' | 'google';

function platformToProviderId(platform: PlatformParam): string {
  switch (platform) {
    case 'reddit':
      return 'reddit';
    case 'x':
      // Better Auth providerId for X is typically "twitter"
      return 'twitter';
    case 'google':
      return 'google';
  }
}

function isSupportedPlatform(platform: string): platform is PlatformParam {
  return platform === 'reddit' || platform === 'x' || platform === 'google';
}

export async function GET(_request: NextRequest, context: { params: Promise<{ platform: string }> }) {
  try {
    const { platform } = await context.params;

    if (!isSupportedPlatform(platform)) {
      return NextResponse.json({ error: 'Unknown platform' }, { status: 404 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await auth.api.listUserAccounts({
      headers: await headers(),
    });

    if (!accounts || accounts.length === 0) {
      return NextResponse.json([]);
    }

    const providerId = platformToProviderId(platform);
    const filtered = accounts.filter((acc: any) => acc.providerId === providerId);

    if (filtered.length === 0) {
      return NextResponse.json([]);
    }

    const withTokenInfo = await Promise.all(
      filtered.map(async (acc: any) => {
        const tokenInfo = await getAccountTokenInfo(acc.id);
        return {
          id: acc.id,
          userId: acc.userId,
          providerId: acc.providerId,
          accountId: acc.accountId,
          accessToken: 'hidden',
          refreshToken: tokenInfo.hasRefreshToken ? 'present' : null,
          accessTokenExpiresAt: tokenInfo.accessTokenExpiresAt?.toISOString() || null,
          isExpired: tokenInfo.isExpired,
          scope: acc.scope,
          createdAt: acc.createdAt,
          updatedAt: acc.updatedAt,
        };
      })
    );

    return NextResponse.json(withTokenInfo);
  } catch (error: any) {
    console.error('[Platform Accounts API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts', details: error?.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ platform: string }> }) {
  try {
    const { platform } = await context.params;

    if (!isSupportedPlatform(platform)) {
      return NextResponse.json({ error: 'Unknown platform' }, { status: 404 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = request.nextUrl.searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const providerId = platformToProviderId(platform);

    const { db } = await import('@/db');
    const { account } = await import('@/db/schema');
    const { and, eq } = await import('drizzle-orm');

    await db
      .delete(account)
      .where(and(eq(account.id, accountId), eq(account.userId, session.user.id), eq(account.providerId, providerId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Platform Accounts API] Delete error:', error);
    return NextResponse.json({ error: 'Failed to disconnect account', details: error?.message }, { status: 500 });
  }
}

