'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button, Container, Stack, Text, Title } from '@mantine/core';

export default function IntegrationCallbackPage() {
  const router = useRouter();
  const params = useParams<{ platform?: string }>();
  const platform = params?.platform ? String(params.platform) : 'provider';

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/integrations');
    }, 800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={2}>{platform} connected</Title>
        <Text c="dimmed">Finishing sign-in… you’ll be redirected back to Integrations.</Text>
        <Button component={Link} href="/integrations" variant="light">
          Go now
        </Button>
      </Stack>
    </Container>
  );
}

