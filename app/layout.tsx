import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';

import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '../theme';
import { FramesProvider } from '../components/AppFrames/FramesContext';
import { AuthIntegrationProvider } from '../components/Auth/AuthIntegrationProvider';

export const metadata = {
  title: 'AppFrames - Create Beautiful App Screenshots',
  description: 'Create stunning app mockups and screenshots with device frames',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" />
          <AuthIntegrationProvider>
            <FramesProvider>{children}</FramesProvider>
          </AuthIntegrationProvider>
        </MantineProvider>
        <Analytics />
      </body>
    </html>
  );
}
