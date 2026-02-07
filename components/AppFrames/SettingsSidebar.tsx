'use client';

import { Box, CloseButton, Divider, Drawer, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import { ImageSettingsPanel, type ImageSettingsPanelProps } from './ImageSettingsPanel';
import { FrameSettingsPanel, type FrameSettingsPanelProps } from './FrameSettingsPanel';
import { CanvasSettingsPanel, type CanvasSettingsPanelProps } from './CanvasSettingsPanel';
import { MOBILE_NAV_HEIGHT } from './MobileBottomNav';

export type SettingsMode = 'frame' | 'canvas';

export interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mode: SettingsMode;
  slotLabel?: string;
  hasImage: boolean;
  imageSettings: ImageSettingsPanelProps;
  frameSettings: FrameSettingsPanelProps;
  canvasSettings?: CanvasSettingsPanelProps;
}

function SettingsContent({
  mode,
  slotLabel,
  hasImage,
  imageSettings,
  frameSettings,
  canvasSettings,
}: Pick<SettingsSidebarProps, 'mode' | 'slotLabel' | 'hasImage' | 'imageSettings' | 'frameSettings' | 'canvasSettings'>) {
  if (mode === 'canvas' && canvasSettings) {
    return (
      <Stack gap={0}>
        <Box p="md">
          <Text size="xs" fw={600} c="dimmed" mb="sm" tt="uppercase">Canvas</Text>
          <CanvasSettingsPanel {...canvasSettings} />
        </Box>
      </Stack>
    );
  }

  return (
    <Stack gap={0}>
      <Box p="md">
        <Text size="xs" fw={600} c="dimmed" mb="sm" tt="uppercase">Frame</Text>
        <FrameSettingsPanel {...frameSettings} />
      </Box>

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
  );
}

export function SettingsSidebar({
  isOpen,
  onClose,
  mode,
  slotLabel,
  hasImage,
  imageSettings,
  frameSettings,
  canvasSettings,
}: SettingsSidebarProps) {
  const isMobile = useMediaQuery('(max-width: 48em)');

  const headerLabel = mode === 'canvas' ? 'Canvas' : 'Settings';

  // Mobile: render as bottom drawer
  if (isMobile) {
    return (
      <Drawer
        opened={isOpen}
        onClose={onClose}
        position="bottom"
        size="70%"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.15 }}
        styles={{
          content: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '70dvh',
          },
          body: {
            padding: 0,
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
          inner: {
            bottom: MOBILE_NAV_HEIGHT,
          },
        }}
      >
        {/* Drawer handle */}
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 16px 0',
            flexShrink: 0,
          }}
        >
          <Box
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#D1D5DB',
              marginBottom: 10,
            }}
          />
        </Box>

        {/* Header */}
        <Group justify="space-between" align="center" px="md" py="xs" style={{ flexShrink: 0 }}>
          <Group gap="xs">
            <IconSettings size={16} color="#666" />
            <Text fw={700} size="sm">{headerLabel}</Text>
            {slotLabel && (
              <Text size="xs" c="dimmed">{slotLabel}</Text>
            )}
          </Group>
          <CloseButton size="sm" onClick={onClose} aria-label="Close settings" />
        </Group>

        <Divider />

        {/* Scrollable content */}
        <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <SettingsContent
            mode={mode}
            slotLabel={slotLabel}
            hasImage={hasImage}
            imageSettings={imageSettings}
            frameSettings={frameSettings}
            canvasSettings={canvasSettings}
          />
        </Box>
      </Drawer>
    );
  }

  // Desktop: render as side panel
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
          <Text fw={700} size="sm">{headerLabel}</Text>
          {slotLabel && (
            <Text size="xs" c="dimmed">{slotLabel}</Text>
          )}
        </Group>
        <CloseButton size="sm" onClick={onClose} aria-label="Close settings" />
      </Group>

      <Divider />

      {/* Scrollable content */}
      <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }} className="scroll-on-hover">
        <SettingsContent
          mode={mode}
          slotLabel={slotLabel}
          hasImage={hasImage}
          imageSettings={imageSettings}
          frameSettings={frameSettings}
          canvasSettings={canvasSettings}
        />
      </Box>
    </Box>
  );
}
