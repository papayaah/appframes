'use client';

import Link from 'next/link';
import { Box, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IntegrationCard } from '@reactkits.dev/better-auth-connect';
import { mantinePreset } from '@reactkits.dev/better-auth-connect/presets/mantine';
import { useAuthSession } from '@reactkits.dev/better-auth-connect';

import { integrationIcons } from '@/components/Auth/integrationIcons';

export default function IntegrationsPage() {
  const { session, loading } = useAuthSession();

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Box>
            <Title order={2}>Integrations</Title>
            <Text c="dimmed" size="sm">
              Sign in is optional. If you sign in, we can associate future sync data with your account.
            </Text>
          </Box>
          <Button component={Link} href="/" variant="light">
            Back to editor
          </Button>
        </Group>

        <Box>
          <Text size="sm" c="dimmed">
            Status:{' '}
            {loading ? 'Loading…' : session?.user ? `Signed in as ${session.user.email || session.user.name || session.user.id}` : 'Not signed in'}
          </Text>
        </Box>

        <IntegrationCard
          platform="google"
          preset={mantinePreset}
          icons={integrationIcons}
        />
      </Stack>
    </Container>
  );
}

