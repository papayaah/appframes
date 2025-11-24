'use client';

import { useState } from 'react';
import { Box, Tabs } from '@mantine/core';
import { IconLayout, IconDeviceMobile, IconPhoto } from '@tabler/icons-react';
import { Sidebar } from './Sidebar';
import { DeviceTab } from './DeviceTab';
import { MediaLibrary } from './MediaLibrary';
import { CanvasSettings, Screen } from './AppFrames';

interface SidebarTabsProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
  screens: Screen[];
  onMediaSelect?: (mediaId: number) => void;
}

export function SidebarTabs({ settings, setSettings, screens, onMediaSelect }: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<string | null>('layout');

  return (
    <Tabs value={activeTab} onChange={setActiveTab} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Tabs.List>
        <Tabs.Tab value="layout" leftSection={<IconLayout size={16} />}>
          Layout
        </Tabs.Tab>
        <Tabs.Tab value="device" leftSection={<IconDeviceMobile size={16} />}>
          Device
        </Tabs.Tab>
        <Tabs.Tab value="media" leftSection={<IconPhoto size={16} />}>
          Media
        </Tabs.Tab>
      </Tabs.List>

      <Box style={{ flex: 1, overflow: 'hidden' }}>
        <Tabs.Panel value="layout" style={{ height: '100%' }}>
          <Sidebar settings={settings} setSettings={setSettings} screens={screens} />
        </Tabs.Panel>

        <Tabs.Panel value="device" style={{ height: '100%' }}>
          <DeviceTab settings={settings} setSettings={setSettings} />
        </Tabs.Panel>

        <Tabs.Panel value="media" style={{ height: '100%' }}>
          <MediaLibrary 
            onSelectMedia={(mediaId) => onMediaSelect && onMediaSelect(mediaId)}
            selectedSlot={settings.selectedScreenIndex}
          />
        </Tabs.Panel>
      </Box>
    </Tabs>
  );
}
