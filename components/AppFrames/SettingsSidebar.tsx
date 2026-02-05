'use client';

import { Box, CloseButton, Divider, Group, Stack, Text } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { ImageSettingsPanel, type ImageSettingsPanelProps } from './ImageSettingsPanel';
import { FrameSettingsPanel, type FrameSettingsPanelProps } from './FrameSettingsPanel';

export interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  slotLabel?: string;
  hasImage: boolean;
  imageSettings: ImageSettingsPanelProps;
  frameSettings: FrameSettingsPanelProps;
}

export function SettingsSidebar({
  isOpen,
  onClose,
  slotLabel,
  hasImage,
  imageSettings,
  frameSettings,
}: SettingsSidebarProps) {
  if (!isOpen) return null;

  return (
    <Box
      data-export-hide
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 320,
        height: '100%',
        borderLeft: '1px solid #E5E7EB',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '-4px 0 12px rgba(0,0,0,0.08)',
      }}
    >
      {/* Notch handle — click to close */}
      <Box
        onClick={onClose}
        style={{
          position: 'absolute',
          left: -10,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 12,
          height: 44,
          borderRadius: 6,
          backgroundColor: '#E8EAF0',
          border: '1px solid #D1D5DB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = '#667eea';
          el.style.borderColor = '#5a6fd6';
          el.style.boxShadow = '0 2px 8px rgba(102,126,234,0.3)';
          el.querySelectorAll<HTMLElement>('[data-grip]').forEach(d => d.style.backgroundColor = 'rgba(255,255,255,0.7)');
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.backgroundColor = '#E8EAF0';
          el.style.borderColor = '#D1D5DB';
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
          el.querySelectorAll<HTMLElement>('[data-grip]').forEach(d => d.style.backgroundColor = '#B0B5C0');
        }}
      >
        {[0, 1, 2].map(i => (
          <Box
            key={i}
            data-grip=""
            style={{
              width: 6,
              height: 1.5,
              borderRadius: 1,
              backgroundColor: '#B0B5C0',
              transition: 'background-color 0.2s ease',
            }}
          />
        ))}
      </Box>

      {/* Header */}
      <Group justify="space-between" align="center" px="md" py="sm" style={{ flexShrink: 0 }}>
        <Group gap="xs">
          <IconSettings size={16} color="#666" />
          <Text fw={700} size="sm">Settings</Text>
          {slotLabel && (
            <Text size="xs" c="dimmed">{slotLabel}</Text>
          )}
        </Group>
        <CloseButton size="sm" onClick={onClose} aria-label="Close settings" />
      </Group>

      <Divider />

      {/* Scrollable content */}
      <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }} className="scroll-on-hover">
        <Stack gap={0}>
          {/* Frame Settings — always visible when sidebar is open */}
          <Box p="md">
            <Text size="xs" fw={600} c="dimmed" mb="sm" tt="uppercase">Frame</Text>
            <FrameSettingsPanel {...frameSettings} />
          </Box>

          {/* Image Settings — only when frame has an image */}
          {hasImage && (
            <>
              <Divider />
              <Box p="md">
                <Text size="xs" fw={600} c="dimmed" mb="sm" tt="uppercase">Image</Text>
                <ImageSettingsPanel {...imageSettings} />
              </Box>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
