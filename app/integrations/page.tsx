'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Container, Group, Stack, Text, Title, Paper, TextInput, Modal, Alert } from '@mantine/core';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { IntegrationCard } from '@reactkits.dev/better-auth-connect';
import { mantinePreset } from '@reactkits.dev/better-auth-connect/presets/mantine';
import { useAuthSession, useIntegrationContext } from '@reactkits.dev/better-auth-connect';

import { integrationIcons } from '@/components/Auth/integrationIcons';
import { getProjectSyncService } from '@/lib/ProjectSyncService';

export default function IntegrationsPage() {
  const { session, loading } = useAuthSession();
  const { authClient } = useIntegrationContext();

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (session?.user) {
        // Signed in: delete account (local + server)
        const syncService = getProjectSyncService();
        await syncService.deleteAccount();

        // Sign out after successful deletion
        await authClient.signOut();
      } else {
        // Not signed in: just clear local data
        const { persistenceDB } = await import('@/lib/PersistenceDB');
        const { clearAllMediaData } = await import('@reactkits.dev/react-media-library');

        await persistenceDB.clearAllData();
        await clearAllMediaData();
      }

      // Force full page reload to clear all React state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Failed to delete:', error);
      setDeleteError(error.message || 'Failed to delete');
      setIsDeleting(false);
    }
  };

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

        {/* Danger Zone - always show */}
        <Paper p="md" withBorder style={{ borderColor: 'var(--mantine-color-red-3)' }}>
          <Stack gap="sm">
            <Group gap="xs">
              <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
              <Title order={4} c="red">Danger Zone</Title>
            </Group>
            <Text size="sm" c="dimmed">
              {session?.user
                ? 'Permanently delete your account and all associated data. This action cannot be undone.'
                : 'Clear all local data (projects and media). This action cannot be undone.'}
            </Text>
            <Button
              color="red"
              variant="outline"
              leftSection={<IconTrash size={16} />}
              onClick={() => setShowDeleteModal(true)}
            >
              {session?.user ? 'Delete Account' : 'Clear All Local Data'}
            </Button>
          </Stack>
        </Paper>
      </Stack>

      {/* Delete/Clear Confirmation Modal */}
      <Modal
        opened={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
            setDeleteConfirmText('');
            setDeleteError(null);
          }
        }}
        title={
          <Group gap="xs">
            <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
            <Text fw={600}>{session?.user ? 'Delete Account' : 'Clear Local Data'}</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Alert color="red" variant="light">
            <Text size="sm" fw={500}>This will permanently delete:</Text>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>All your projects</li>
              <li>All your uploaded media files</li>
              {session?.user && <li>Your account and all associated data</li>}
            </ul>
          </Alert>

          <Text size="sm">
            Type <strong>DELETE</strong> to confirm:
          </Text>

          <TextInput
            placeholder="Type DELETE to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.currentTarget.value)}
            disabled={isDeleting}
            error={deleteError}
          />

          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              loading={isDeleting}
            >
              {session?.user ? 'Delete Account Forever' : 'Clear All Data'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

