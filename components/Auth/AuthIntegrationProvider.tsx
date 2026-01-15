'use client';

import type { ReactNode } from 'react';
import { createAuthClient } from 'better-auth/client';
import { IntegrationProvider } from '@reactkits.dev/better-auth-connect';
import type { AuthClient as ConnectAuthClient } from '@reactkits.dev/better-auth-connect';

const rawAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

const authClient: ConnectAuthClient = {
  getSession: async () => {
    // Better Auth returns { data: { user, session } | null } (plus error typing).
    // better-auth-connect expects { data: { user } | null }.
    const result: any = await rawAuthClient.getSession();
    const data = result?.data ?? null;
    if (!data) return { data: null };

    return {
      data: {
        user: {
          id: data.user.id,
          name: data.user.name ?? undefined,
          email: data.user.email ?? undefined,
          image: data.user.image ?? undefined, // normalize null → undefined
        },
        expiresAt: data.session?.expiresAt ?? undefined,
      },
    };
  },
  signIn: {
    social: async ({ provider, callbackURL, scopes }) => {
      await (rawAuthClient as any).signIn.social({ provider, callbackURL, scopes });
    },
  },
  linkSocial: async ({ provider, callbackURL, scopes }) => {
    await (rawAuthClient as any).linkSocial({ provider, callbackURL, scopes });
  },
  signOut: async () => {
    await (rawAuthClient as any).signOut();
  },
};

export function AuthIntegrationProvider({ children }: { children: ReactNode }) {
  return (
    <IntegrationProvider
      authClient={authClient}
      apiBasePath=""
      onError={(err) => {
        // eslint-disable-next-line no-console
        console.error('[better-auth-connect]', err);
      }}
    >
      {children}
    </IntegrationProvider>
  );
}

