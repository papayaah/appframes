'use client';

import Image from 'next/image';
import { Group, Text, ActionIcon, Box, Slider, Tooltip } from '@mantine/core';
import { IconDownload, IconFileZip } from '@tabler/icons-react';

interface HeaderProps {
  onDownload?: () => void; // Download currently visible screens individually
  onExport?: () => void; // Export all screens (zip if multiple)
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  selectedCount?: number; // Number of currently visible/selected screens
  totalCount?: number; // Total number of screens in panel
}

export function Header({
  onDownload,
  onExport,
  zoom = 100,
  onZoomChange,
  selectedCount = 1,
  totalCount = 1,
}: HeaderProps) {
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
        <Image
          src="/logo.png"
          alt="AppFrames Logo"
          width={180}
          height={50}
          style={{ objectFit: 'contain' }}
          priority
        />
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
        <Tooltip label={`Download${selectedCount > 1 ? ` (${selectedCount} screens)` : ''}`}>
          <ActionIcon
            size="lg"
            variant="light"
            onClick={onDownload}
            aria-label="Download"
          >
            <IconDownload size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label={`Export${totalCount > 1 ? ` All (${totalCount} screens)` : ''}`}>
          <ActionIcon
            size="lg"
            onClick={onExport}
            aria-label="Export"
          >
            <IconFileZip size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Box>
  );
}
