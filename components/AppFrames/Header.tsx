'use client';

import { Group, Text, ActionIcon, Button, Box, Slider } from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconDownload } from '@tabler/icons-react';

interface HeaderProps {
  onExport?: () => void;
  outputDimensions?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export function Header({ onExport, outputDimensions = '1242 × 2688px', zoom = 100, onZoomChange }: HeaderProps) {
  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid #E5E7EB',
        position: 'relative',
      }}
    >
      <Group gap="sm">
        <Box
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          AS
        </Box>
        <Text size="lg" fw={600}>
          AppFrames
        </Text>
        <Text size="sm" c="dimmed">
          v2.3
        </Text>
      </Group>

      <Group gap="md" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Text size="xs" c="dimmed" style={{ minWidth: 40 }}>
          Zoom
        </Text>
        <Slider
          value={zoom}
          onChange={(value) => onZoomChange?.(value)}
          min={25}
          max={200}
          label={(value) => `${value}%`}
          style={{ width: 200 }}
          size="sm"
        />
        <Text size="xs" c="dimmed" style={{ minWidth: 45 }}>
          {zoom}%
        </Text>
      </Group>

      <Group gap="xs">
        <Text size="sm" c="dimmed">
          OUTPUT: {outputDimensions}
        </Text>
        <ActionIcon variant="subtle" color="gray" size="lg">
          <IconDeviceDesktop size={18} />
        </ActionIcon>
        <ActionIcon variant="subtle" color="gray" size="lg">
          <IconMoon size={18} />
        </ActionIcon>
        <Button leftSection={<IconDownload size={16} />} size="sm" onClick={onExport}>
          Export
        </Button>
      </Group>
    </Box>
  );
}
