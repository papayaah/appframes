'use client';

import { useState } from 'react';
import { Box, Text, Drawer } from '@mantine/core';
import {
  IconLayout,
  IconDeviceMobile,
  IconPhoto,
  IconTypography,
  IconSettings,
  IconStack,
} from '@tabler/icons-react';
import { Sidebar } from './Sidebar';
import { DeviceTab } from './DeviceTab';
import { TextTab } from './TextTab';
import { LayersTab } from './LayersTab';
import { MediaLibrary } from './MediaLibrary';
import { CanvasSettings, Screen } from './AppFrames';

interface MobileBottomNavProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
  screens: Screen[];
  selectedFrameIndex?: number;
  onMediaSelect?: (mediaId: number) => void;
  downloadFormat: 'png' | 'jpg';
  onDownloadFormatChange: (format: 'png' | 'jpg') => void;
  downloadJpegQuality: number;
  onDownloadJpegQualityChange: (quality: number) => void;
}

type TabId = 'layout' | 'device' | 'text' | 'layers' | 'media' | 'settings';

const tabs: { id: TabId; icon: typeof IconLayout; label: string }[] = [
  { id: 'layout', icon: IconLayout, label: 'Layout' },
  { id: 'device', icon: IconDeviceMobile, label: 'Frame' },
  { id: 'text', icon: IconTypography, label: 'Text' },
  { id: 'layers', icon: IconStack, label: 'Layers' },
  { id: 'media', icon: IconPhoto, label: 'Media' },
  { id: 'settings', icon: IconSettings, label: 'Settings' },
];

export const MOBILE_NAV_HEIGHT = 56;

export function MobileBottomNav({
  settings,
  setSettings,
  screens,
  selectedFrameIndex = 0,
  onMediaSelect,
  downloadFormat,
  onDownloadFormatChange,
  downloadJpegQuality,
  onDownloadJpegQualityChange,
}: MobileBottomNavProps) {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);

  const handleTabClick = (tabId: TabId) => {
    if (activeTab === tabId) {
      setActiveTab(null);
    } else {
      setActiveTab(tabId);
    }
  };

  const renderPanelContent = (tabId: TabId) => {
    switch (tabId) {
      case 'layout':
        return <Sidebar settings={settings} setSettings={setSettings} screens={screens} />;
      case 'device':
        return <DeviceTab />;
      case 'text':
        return <TextTab />;
      case 'layers':
        return <LayersTab />;
      case 'media':
        return (
          <MediaLibrary
            onSelectMedia={(mediaId) => onMediaSelect && onMediaSelect(mediaId)}
            selectedSlot={settings.selectedScreenIndex}
          />
        );
      case 'settings':
        return (
          <Box style={{ height: '100%', overflow: 'auto' }} className="scroll-on-hover">
            <Box p="md">
              <Text fw={700} mb="md">Download</Text>
              <Box mb="md">
                <Text size="sm" fw={600} mb={4}>Format</Text>
                <Text size="xs" c="dimmed" mb={8}>PNG can preserve transparency; JPG flattens the image (no alpha).</Text>
                <Box style={{ display: 'flex', gap: 8 }}>
                  {(['png', 'jpg'] as const).map((fmt) => (
                    <Box
                      key={fmt}
                      onClick={() => onDownloadFormatChange(fmt)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '2px solid',
                        borderColor: downloadFormat === fmt ? '#228be6' : '#dee2e6',
                        backgroundColor: downloadFormat === fmt ? '#e7f5ff' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <Text size="sm" fw={500}>{fmt.toUpperCase()}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Text size="xs" c="dimmed">
                Tip: App Store screenshot uploads often reject alpha. Use JPG or set a solid Background Color.
              </Text>
            </Box>
          </Box>
        );
    }
  };

  const activeLabel = tabs.find((t) => t.id === activeTab)?.label;

  return (
    <>
      {/* Bottom Drawer for panel content */}
      <Drawer
        opened={activeTab !== null}
        onClose={() => setActiveTab(null)}
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
            // Keep drawer above the bottom nav
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
          {activeLabel && (
            <Text size="sm" fw={700} mb={8}>
              {activeLabel}
            </Text>
          )}
        </Box>

        {/* Panel content */}
        <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {activeTab && renderPanelContent(activeTab)}
        </Box>
      </Drawer>

      {/* Bottom Navigation Bar */}
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: MOBILE_NAV_HEIGHT,
          backgroundColor: 'white',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 300,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <Box
              key={id}
              onClick={() => handleTabClick(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                padding: '6px 0',
                cursor: 'pointer',
                color: isActive ? '#667eea' : '#666',
                transition: 'color 0.15s ease',
              }}
            >
              <Icon size={22} stroke={isActive ? 2.2 : 1.5} />
              <Text size="10px" fw={isActive ? 600 : 400} lh={1}>
                {label}
              </Text>
            </Box>
          );
        })}
      </Box>
    </>
  );
}
