'use client';

import { Box, Text, Stack } from '@mantine/core';
import { IconUpload, IconDeviceMobile } from '@tabler/icons-react';

export function WelcomeState() {
  return (
    <Box
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        maxWidth: 400,
      }}
    >
      <Stack gap="lg" align="center">
        <Box
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconDeviceMobile size={40} color="white" />
        </Box>

        <Box>
          <Text size="xl" fw={700} mb="xs">
            Welcome to ScreensStudio
          </Text>
          <Text size="sm" c="dimmed">
            Create beautiful app screenshots with device frames
          </Text>
        </Box>

        <Box
          style={{
            padding: '20px 30px',
            border: '2px dashed #dee2e6',
            borderRadius: 12,
            backgroundColor: '#f8f9fa',
          }}
        >
          <IconUpload size={32} color="#868e96" style={{ margin: '0 auto 12px' }} />
          <Text size="sm" fw={500} mb={4}>
            Drag & drop your screenshots here
          </Text>
          <Text size="xs" c="dimmed">
            or use the "NEW SCREEN" button below
          </Text>
        </Box>

        <Box>
          <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
            Supports PNG, JPG, and other image formats
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
